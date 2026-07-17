import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../auth/presentation/providers/auth_provider.dart';
import '../../../organization/presentation/providers/organization_provider.dart';
import '../../data/models/notification_item.dart';
import '../../data/models/notification_settings.dart';
import '../../data/models/user_profile.dart';
import '../../data/repositories/user_repository.dart';

final myProfileProvider = FutureProvider<UserProfile>((ref) {
  final user = ref.watch(authStateProvider).valueOrNull?.user;
  if (user == null) {
    throw StateError('User must be signed in to load profile');
  }
  return ref.watch(userRepositoryProvider).getProfile();
});

/// Whether the current user is a trusted verifier in the active organization.
/// Gates the "Xác minh cựu sinh viên" entry (only authorised verifiers see it).
final isTrustedVerifierProvider = FutureProvider<bool>((ref) async {
  final org = ref.watch(organizationStateProvider).valueOrNull;
  if (org == null) return false;
  try {
    return await ref.read(userRepositoryProvider).isTrustedVerifier(org.id);
  } catch (_) {
    return false;
  }
});

/// The current user's `verificationLevel` in the active organization (0 =
/// unverified email, 1 = email verified, 2+ = academic/org verified). Mirrors
/// the web mentee-signup eligibility gate (`MIN_VERIFICATION_LEVEL = 2`).
final myVerificationLevelProvider = FutureProvider<int>((ref) async {
  final auth = ref.watch(authStateProvider).valueOrNull;
  final fallback = auth?.verificationLevel ?? 0;
  if (auth?.user == null) return 0;

  final org = ref.watch(organizationStateProvider).valueOrNull;
  if (org == null) return fallback;
  try {
    return await ref
        .read(userRepositoryProvider)
        .getMyVerificationLevel(org.id);
  } catch (_) {
    return fallback;
  }
});

/// Current org manager gate, matching the web `useCanContribute` rule:
/// effective verification level 4 unlocks admin/staff affordances in the
/// selected organization. This avoids granting STAFF tools by JWT role alone
/// after switching to an organization where that staff user is not a manager.
final isOrgManagerProvider = FutureProvider<bool>((ref) async {
  final auth = ref.watch(authStateProvider).valueOrNull;
  if (auth?.user == null) return false;
  if (auth!.user!.role?.toUpperCase() == 'STAFF') return false;
  final level = await ref.watch(myVerificationLevelProvider.future);
  return level >= 4;
});

/// Event QR check-in gate. This is intentionally narrower than
/// [isOrgManagerProvider]: STAFF can check in tickets only for their own
/// token-scoped organization, while broad admin/event-management screens stay
/// hidden from STAFF on mobile.
final canEventCheckInProvider = FutureProvider<bool>((ref) async {
  final auth = ref.watch(authStateProvider).valueOrNull;
  final user = auth?.user;
  final org = ref.watch(organizationStateProvider).valueOrNull;
  if (user == null || org == null) return false;

  final role = user.role?.toUpperCase();
  if (role == 'STAFF') {
    final level = await ref.watch(myVerificationLevelProvider.future);
    return level >= 4 && user.organizationId == org.id;
  }
  return ref.watch(isOrgManagerProvider.future);
});

/// Community contribution gate, matching the web `useCanContribute` rule:
/// forum posting/replying and content contribution require level 2+.
final canContributeProvider = FutureProvider<bool>((ref) async {
  final auth = ref.watch(authStateProvider).valueOrNull;
  if (auth?.user == null) return false;
  final level = await ref.watch(myVerificationLevelProvider.future);
  return level >= 2;
});

final notificationSettingsProvider = FutureProvider<NotificationSettings>((
  ref,
) {
  return ref.watch(userRepositoryProvider).getNotificationSettings();
});

final notificationsProvider = FutureProvider<List<NotificationItem>>((ref) {
  return ref.watch(userRepositoryProvider).getNotifications();
});

final publicProfileProvider = FutureProvider.family<UserProfile, int>((
  ref,
  userId,
) {
  return ref.watch(userRepositoryProvider).getPublicProfile(userId);
});
