import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../data/models/mentor_availability.dart';
import '../../data/models/mentor_profile.dart';
import '../../data/models/mentorship_session.dart';
import '../../data/models/session_feedback.dart';
import '../../data/repositories/mentorship_repository.dart';

/// Browse filter state for the mentorship list screen.
class MentorQuery {
  final String keyword;
  final String? category;
  final String? expertise;

  const MentorQuery({this.keyword = '', this.category, this.expertise});

  MentorQuery copyWith({String? keyword, String? category, String? expertise,
      bool clearCategory = false, bool clearExpertise = false}) {
    return MentorQuery(
      keyword: keyword ?? this.keyword,
      category: clearCategory ? null : (category ?? this.category),
      expertise: clearExpertise ? null : (expertise ?? this.expertise),
    );
  }
}

final mentorQueryProvider =
    StateProvider<MentorQuery>((ref) => const MentorQuery());

/// Mentor list, reacting to the current [mentorQueryProvider].
final mentorListProvider = FutureProvider<List<MentorProfile>>((ref) async {
  final q = ref.watch(mentorQueryProvider);
  return ref.watch(mentorshipRepositoryProvider).browseMentors(
        keyword: q.keyword,
        category: q.category,
        expertise: q.expertise,
        limit: 20,
      );
});

final expertiseCategoriesProvider = FutureProvider<List<String>>((ref) {
  return ref.watch(mentorshipRepositoryProvider).getExpertiseCategories();
});

final expertiseTopicsProvider = FutureProvider<List<String>>((ref) {
  return ref.watch(mentorshipRepositoryProvider).getExpertiseTopics();
});

final mentorProfileProvider =
    FutureProvider.family<MentorProfile, int>((ref, memberId) {
  return ref.watch(mentorshipRepositoryProvider).getMentorProfile(memberId);
});

final mentorAvailabilityProvider =
    FutureProvider.family<List<MentorAvailability>, int>((ref, memberId) {
  return ref.watch(mentorshipRepositoryProvider).getMentorAvailability(memberId);
});

final mySessionsProvider = FutureProvider<List<MentorshipSession>>((ref) {
  return ref.watch(mentorshipRepositoryProvider).getMySessions();
});

/// The current user's mentor profile (null if not a mentor). Used to decide
/// whether to show "Trở thành cố vấn" vs an already-registered state.
final myMentorProfileProvider = FutureProvider<MentorProfile?>((ref) {
  return ref.watch(mentorshipRepositoryProvider).getMyMentorProfile();
});

/// Sessions received by the current user as a mentor.
final mentorSessionsProvider = FutureProvider<List<MentorshipSession>>((ref) {
  return ref.watch(mentorshipRepositoryProvider).getMentorSessions();
});

/// Availability slots managed by the current mentor.
final myAvailabilityProvider = FutureProvider<List<MentorAvailability>>((ref) {
  return ref.watch(mentorshipRepositoryProvider).getMyAvailability();
});

/// Feedbacks received by the current mentor.
final myMentorFeedbacksProvider = FutureProvider<List<SessionFeedback>>((ref) {
  return ref.watch(mentorshipRepositoryProvider).getMyMentorFeedbacks();
});

/// Public feedback list for a mentor's profile page.
final mentorFeedbacksProvider =
    FutureProvider.family<List<SessionFeedback>, int>((ref, memberId) {
  return ref
      .watch(mentorshipRepositoryProvider)
      .getMentorFeedbacks(memberId, page: 0, limit: 20);
});
