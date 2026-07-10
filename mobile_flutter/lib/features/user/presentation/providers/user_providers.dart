import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../organization/presentation/providers/organization_provider.dart';
import '../../data/models/notification_item.dart';
import '../../data/models/notification_settings.dart';
import '../../data/models/user_profile.dart';
import '../../data/repositories/user_repository.dart';

final myProfileProvider = FutureProvider<UserProfile>((ref) {
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
  final org = ref.watch(organizationStateProvider).valueOrNull;
  if (org == null) return 0;
  return ref.read(userRepositoryProvider).getMyVerificationLevel(org.id);
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
