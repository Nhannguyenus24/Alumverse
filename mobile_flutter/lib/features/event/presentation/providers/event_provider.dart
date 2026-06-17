import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../data/models/event_summary.dart';
import '../../data/repositories/event_repository.dart';

/// Upcoming events for the home feed.
final upcomingEventsProvider = FutureProvider<List<EventSummary>>((ref) async {
  return ref.watch(eventRepositoryProvider).getUpcoming(page: 0, limit: 6);
});

/// Full upcoming list for the Events screen.
final allUpcomingEventsProvider =
    FutureProvider<List<EventSummary>>((ref) async {
  return ref.watch(eventRepositoryProvider).getUpcoming(page: 0, limit: 20);
});

/// Past events for the Events screen.
final pastEventsProvider = FutureProvider<List<EventSummary>>((ref) async {
  return ref.watch(eventRepositoryProvider).getPast(page: 0, limit: 12);
});

/// Full detail for one event.
final eventDetailProvider =
    FutureProvider.family<EventSummary, int>((ref, id) {
  return ref.read(eventRepositoryProvider).getDetail(id);
});

/// Interaction state for the detail screen: interested/registered flags +
/// live stat counts. Re-fetched (invalidated) after each toggle/register.
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
}

final eventInteractionProvider =
    FutureProvider.family<EventInteraction, int>((ref, id) async {
  final repo = ref.read(eventRepositoryProvider);
  final results = await Future.wait([
    repo.isInterested(id).catchError((_) => false),
    repo.isRegistered(id).catchError((_) => false),
    repo.getStatistics(id).catchError(
        (_) => (interested: 0, registered: 0)),
  ]);
  final stats = results[2] as ({int interested, int registered});
  return EventInteraction(
    interested: results[0] as bool,
    registered: results[1] as bool,
    interestedCount: stats.interested,
    registeredCount: stats.registered,
  );
});
