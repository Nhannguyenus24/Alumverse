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
