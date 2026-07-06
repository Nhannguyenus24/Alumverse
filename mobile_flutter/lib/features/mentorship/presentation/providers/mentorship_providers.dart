import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../data/models/mentor_availability.dart';
import '../../data/models/mentor_profile.dart';
import '../../data/models/mentorship_session.dart';
import '../../data/models/session_feedback.dart';
import '../../data/models/skill.dart';
import '../../data/repositories/mentorship_repository.dart';

/// Browse filter state for the mentorship list screen. Replaces the old
/// separate category/topic free-text filters with a single normalized
/// "filter by skill" (multi-select over the skills catalog).
class MentorQuery {
  final String keyword;
  final List<Skill> skills;

  const MentorQuery({this.keyword = '', this.skills = const []});

  MentorQuery copyWith({String? keyword, List<Skill>? skills}) {
    return MentorQuery(
      keyword: keyword ?? this.keyword,
      skills: skills ?? this.skills,
    );
  }
}

final mentorQueryProvider = StateProvider<MentorQuery>(
  (ref) => const MentorQuery(),
);

/// Mentor list, reacting to the current [mentorQueryProvider].
final mentorListProvider = FutureProvider<List<MentorProfile>>((ref) async {
  final q = ref.watch(mentorQueryProvider);
  return ref
      .watch(mentorshipRepositoryProvider)
      .browseMentors(
        keyword: q.keyword,
        skillIds: q.skills.map((s) => s.id).toList(),
        limit: 20,
      );
});

/// Skill catalog search backing the "filter by skill" dropdown, keyed by the
/// current search text (%LIKE%, sorted A-Z by the backend).
final skillSearchProvider = FutureProvider.family<List<Skill>, String>((
  ref,
  search,
) {
  return ref.watch(mentorshipRepositoryProvider).searchSkills(search: search);
});

final mentorProfileProvider = FutureProvider.family<MentorProfile, int>((
  ref,
  memberId,
) {
  return ref.watch(mentorshipRepositoryProvider).getMentorProfile(memberId);
});

final mentorAvailabilityProvider =
    FutureProvider.family<List<MentorAvailability>, int>((ref, memberId) {
      return ref
          .watch(mentorshipRepositoryProvider)
          .getMentorAvailability(memberId);
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

/// Single mentee session by ID — used by the session detail screen.
final menteeSessionByIdProvider = FutureProvider.family<MentorshipSession, int>(
  (ref, sessionId) {
    return ref
        .watch(mentorshipRepositoryProvider)
        .getMenteeSessionById(sessionId);
  },
);
