import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../auth/presentation/providers/auth_provider.dart';
import '../../../organization/presentation/providers/organization_provider.dart';
import '../../../user/presentation/providers/user_providers.dart';
import '../../data/models/mentee_profile.dart';
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

class MentorshipAccess {
  const MentorshipAccess({
    required this.isLoggedIn,
    required this.isGlobalAdmin,
    required this.verificationLevel,
  });

  final bool isLoggedIn;
  final bool isGlobalAdmin;
  final int verificationLevel;

  bool get isOrgManager => isGlobalAdmin || verificationLevel >= 4;
  bool get canUseMentorship =>
      isLoggedIn && (isGlobalAdmin || verificationLevel >= 2);
  bool get canParticipateInMentorship => canUseMentorship && !isOrgManager;
  bool get canPreviewMentors =>
      isLoggedIn && (isGlobalAdmin || verificationLevel >= 1);
}

final mentorshipAccessProvider = FutureProvider<MentorshipAccess>((ref) async {
  final auth = ref.watch(authStateProvider).valueOrNull;
  final user = auth?.user;
  final role = user?.role?.toUpperCase();
  final isGlobalAdmin = role == 'ADMIN';
  final isLoggedIn = user != null;
  final level =
      isLoggedIn ? await ref.watch(myVerificationLevelProvider.future) : 0;

  return MentorshipAccess(
    isLoggedIn: isLoggedIn,
    isGlobalAdmin: isGlobalAdmin,
    verificationLevel: level,
  );
});

/// Mentor list, reacting to the current [mentorQueryProvider].
final mentorListProvider = FutureProvider<List<MentorProfile>>((ref) async {
  final q = ref.watch(mentorQueryProvider);
  final access = await ref.watch(mentorshipAccessProvider.future);
  final org = ref.watch(organizationStateProvider).valueOrNull;
  if (!access.canPreviewMentors || org == null) return const [];
  return ref
      .watch(mentorshipRepositoryProvider)
      .browseMentors(
        keyword: q.keyword,
        skillIds: q.skills.map((s) => s.id).toList(),
        organizationId: org.id,
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
  final org = ref.watch(organizationStateProvider).valueOrNull;
  return ref
      .watch(mentorshipRepositoryProvider)
      .getMentorProfile(memberId, organizationId: org?.id);
});

final mentorAvailabilityProvider =
    FutureProvider.family<List<MentorAvailability>, int>((ref, memberId) async {
      final access = await ref.watch(mentorshipAccessProvider.future);
      if (!access.canParticipateInMentorship) return const [];
      final org = ref.watch(organizationStateProvider).valueOrNull;
      return ref
          .watch(mentorshipRepositoryProvider)
          .getMentorAvailability(memberId, organizationId: org?.id);
    });

final mySessionsProvider = FutureProvider<List<MentorshipSession>>((ref) {
  return ref.watch(mentorshipRepositoryProvider).getMySessions();
});

/// The current user's mentor profile (null if not a mentor). Used to decide
/// whether to show "Trở thành cố vấn" vs an already-registered state.
final myMentorProfileProvider = FutureProvider<MentorProfile?>((ref) async {
  final access = await ref.watch(mentorshipAccessProvider.future);
  if (!access.canParticipateInMentorship) return null;
  return ref.watch(mentorshipRepositoryProvider).getMyMentorProfile();
});

bool _isApprovedMentor(MentorProfile? profile) =>
    (profile?.status ?? '').toUpperCase() == 'APPROVED';

/// True only when the current user can call mentor-side management endpoints.
final isApprovedMentorProvider = FutureProvider<bool>((ref) async {
  final profile = await ref.watch(myMentorProfileProvider.future);
  return _isApprovedMentor(profile);
});

/// Sessions received by the current user as a mentor.
final mentorSessionsProvider = FutureProvider<List<MentorshipSession>>((
  ref,
) async {
  final profile = await ref.watch(myMentorProfileProvider.future);
  if (!_isApprovedMentor(profile)) return const [];
  return ref.watch(mentorshipRepositoryProvider).getMentorSessions();
});

/// Availability slots managed by the current mentor.
final myAvailabilityProvider = FutureProvider<List<MentorAvailability>>((
  ref,
) async {
  final profile = await ref.watch(myMentorProfileProvider.future);
  if (!_isApprovedMentor(profile)) return const [];
  return ref.watch(mentorshipRepositoryProvider).getMyAvailability();
});

/// Feedbacks received by the current mentor.
final myMentorFeedbacksProvider = FutureProvider<List<SessionFeedback>>((
  ref,
) async {
  final profile = await ref.watch(myMentorProfileProvider.future);
  if (!_isApprovedMentor(profile)) return const [];
  return ref.watch(mentorshipRepositoryProvider).getMyMentorFeedbacks();
});

/// Public feedback list for a mentor's profile page.
final mentorFeedbacksProvider =
    FutureProvider.family<List<SessionFeedback>, int>((ref, memberId) {
      final org = ref.watch(organizationStateProvider).valueOrNull;
      return ref
          .watch(mentorshipRepositoryProvider)
          .getMentorFeedbacks(
            memberId,
            page: 0,
            limit: 20,
            organizationId: org?.id,
          );
    });

/// Single mentee session by ID — used by the session detail screen.
final menteeSessionByIdProvider = FutureProvider.family<MentorshipSession, int>(
  (ref, sessionId) {
    return ref
        .watch(mentorshipRepositoryProvider)
        .getMenteeSessionById(sessionId);
  },
);

final myMenteeProfileProvider = FutureProvider<MenteeProfile?>((ref) async {
  final access = await ref.watch(mentorshipAccessProvider.future);
  if (!access.canParticipateInMentorship) return null;
  return ref.watch(mentorshipRepositoryProvider).getMyMenteeProfile();
});
