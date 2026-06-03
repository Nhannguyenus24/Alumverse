import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../data/models/event_summary.dart';
import '../../data/repositories/event_repository.dart';

/// Upcoming events for the home feed.
final upcomingEventsProvider = FutureProvider<List<EventSummary>>((ref) async {
  return ref.watch(eventRepositoryProvider).getUpcoming(page: 0, limit: 6);
});
