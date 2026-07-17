import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../organization/presentation/providers/organization_provider.dart';
import '../../data/models/event_summary.dart';
import '../../data/models/event_ticket.dart';
import '../../data/repositories/event_repository.dart';

/// Upcoming events for the home feed.
final upcomingEventsProvider = FutureProvider<List<EventSummary>>((ref) async {
  final orgId = ref.watch(organizationStateProvider).valueOrNull?.id;
  if (orgId == null) return const [];
  return ref
      .watch(eventRepositoryProvider)
      .getUpcoming(page: 0, limit: 6, organizationId: orgId);
});

/// Full upcoming list for the Events screen.
final allUpcomingEventsProvider = FutureProvider<List<EventSummary>>((
  ref,
) async {
  final orgId = ref.watch(organizationStateProvider).valueOrNull?.id;
  if (orgId == null) return const [];
  return ref
      .watch(eventRepositoryProvider)
      .getUpcoming(page: 0, limit: 20, organizationId: orgId);
});

/// Past events for the Events screen.
final pastEventsProvider = FutureProvider<List<EventSummary>>((ref) async {
  final orgId = ref.watch(organizationStateProvider).valueOrNull?.id;
  if (orgId == null) return const [];
  return ref
      .watch(eventRepositoryProvider)
      .getPast(page: 0, limit: 12, organizationId: orgId);
});

/// Full detail for one event.
final eventDetailProvider = FutureProvider.autoDispose
    .family<EventSummary, int>((ref, id) {
      return ref.read(eventRepositoryProvider).getDetail(id);
    });

/// Events of an organization for the admin check-in picker (drafts + past
/// included). Keyed by organization id. Admin/staff session required.
final adminCheckInEventsProvider = FutureProvider.autoDispose
    .family<List<EventSummary>, int>((ref, organizationId) {
      return ref
          .watch(eventRepositoryProvider)
          .getOrganizationEvents(organizationId);
    });

/// The current user's registration tickets ("Vé của tôi").
final myTicketsProvider = FutureProvider<List<EventTicket>>((ref) {
  return ref.watch(eventRepositoryProvider).getMyTickets();
});

/// A ticket's full detail by its code (used by the ticket detail screen).
final ticketByCodeProvider = FutureProvider.autoDispose
    .family<EventTicket, String>((ref, code) {
      return ref.read(eventRepositoryProvider).getTicketByCode(code);
    });

/// Interaction state for the detail screen: interested/registered flags +
/// live stat counts.
class EventInteraction {
  final bool interested;
  final bool registered;
  final int interestedCount;
  final int registeredCount;

  const EventInteraction({
    this.interested = false,
    this.registered = false,
    this.interestedCount = 0,
    this.registeredCount = 0,
  });

  EventInteraction copyWith({
    bool? interested,
    bool? registered,
    int? interestedCount,
    int? registeredCount,
  }) {
    return EventInteraction(
      interested: interested ?? this.interested,
      registered: registered ?? this.registered,
      interestedCount: interestedCount ?? this.interestedCount,
      registeredCount: registeredCount ?? this.registeredCount,
    );
  }
}

/// Loads + holds the interaction state for one event. Exposes optimistic
/// mutators so the counts/flags update instantly after an action, then resync
/// with the server in the background (the statistics read can momentarily lag
/// a just-committed write, so we don't rely on it alone for the count).
class EventInteractionNotifier
    extends AutoDisposeFamilyAsyncNotifier<EventInteraction, int> {
  EventRepository get _repo => ref.read(eventRepositoryProvider);

  @override
  Future<EventInteraction> build(int arg) => _load(arg);

  Future<EventInteraction> _load(int id) async {
    final results = await Future.wait([
      _repo.isInterested(id).catchError((_) => false),
      _repo.isRegistered(id).catchError((_) => false),
      _repo
          .getStatistics(id)
          .then<({int interested, int registered})?>((s) => s)
          .catchError((_) => null),
    ]);
    final interested = results[0] as bool;
    final registered = results[1] as bool;
    final stats = results[2] as ({int interested, int registered})?;
    // If statistics failed, keep whatever counts we already have (avoid
    // clobbering a good count with 0). On first load there's nothing yet, so
    // fall back to deriving a floor from the flags.
    final prev = state.valueOrNull;
    return EventInteraction(
      interested: interested,
      registered: registered,
      interestedCount: stats?.interested ?? prev?.interestedCount ?? 0,
      registeredCount: stats?.registered ?? prev?.registeredCount ?? 0,
    );
  }

  void _setOptimistic(EventInteraction next) => state = AsyncData(next);

  Future<void> _resync() async {
    final next = await _load(arg);
    state = AsyncData(next);
  }

  Future<void> addInterest() async {
    final cur = state.valueOrNull ?? const EventInteraction();
    _setOptimistic(
      cur.copyWith(
        interested: true,
        interestedCount:
            cur.interested ? cur.interestedCount : cur.interestedCount + 1,
      ),
    );
    try {
      await _repo.addInterest(arg);
    } catch (_) {
      // 409 already-interested etc. — ignore; resync corrects the truth.
    }
    await _resync();
  }

  Future<void> removeInterest() async {
    final cur = state.valueOrNull ?? const EventInteraction();
    _setOptimistic(
      cur.copyWith(
        interested: false,
        interestedCount:
            cur.interested && cur.interestedCount > 0
                ? cur.interestedCount - 1
                : cur.interestedCount,
      ),
    );
    try {
      await _repo.removeInterest(arg);
    } catch (_) {}
    await _resync();
  }

  Future<void> register(List<Map<String, dynamic>>? answers) async {
    await _repo.register(arg, answers: answers);
    final cur = state.valueOrNull ?? const EventInteraction();
    _setOptimistic(
      cur.copyWith(
        registered: true,
        registeredCount:
            cur.registered ? cur.registeredCount : cur.registeredCount + 1,
        // Registering implies interest on the backend; reflect it locally too.
        interested: true,
        interestedCount:
            cur.interested ? cur.interestedCount : cur.interestedCount + 1,
      ),
    );
    await _resync();
  }

  Future<void> cancelRegistration(String reason) async {
    await _repo.cancelRegistration(arg, reason);
    final cur = state.valueOrNull ?? const EventInteraction();
    _setOptimistic(
      cur.copyWith(
        registered: false,
        registeredCount:
            cur.registered && cur.registeredCount > 0
                ? cur.registeredCount - 1
                : cur.registeredCount,
      ),
    );
    await _resync();
  }
}

final eventInteractionProvider = AsyncNotifierProvider.autoDispose
    .family<EventInteractionNotifier, EventInteraction, int>(
      EventInteractionNotifier.new,
    );
