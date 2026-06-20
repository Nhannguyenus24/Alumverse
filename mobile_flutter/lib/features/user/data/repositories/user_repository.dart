import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../datasources/user_api.dart';
import '../models/notification_item.dart';
import '../models/notification_settings.dart';
import '../models/user_profile.dart';

final userRepositoryProvider = Provider<UserRepository>((ref) {
  return UserRepository(ref.watch(userApiProvider));
});

class UserRepository {
  UserRepository(this._api);

  final UserApi _api;

  Future<UserProfile> getProfile() => _api.getProfile();

  Future<void> updateProfile({
    required int organizationId,
    String? phone,
    String? gender,
    String? bio,
  }) =>
      _api.updateProfile(
        organizationId: organizationId,
        phone: phone,
        gender: gender,
        bio: bio,
      );

  Future<NotificationSettings> getNotificationSettings() =>
      _api.getNotificationSettings();

  Future<void> updateNotificationSettings(NotificationSettings s) =>
      _api.updateNotificationSettings(s);

  Future<List<NotificationItem>> getNotifications() => _api.getNotifications();

  Future<void> markRead(String id) => _api.markRead(id);

  Future<void> deleteNotification(String id) => _api.deleteNotification(id);

  Future<void> deleteAllNotifications() => _api.deleteAllNotifications();

  Future<UserProfile> getPublicProfile(int userId) =>
      _api.getPublicProfile(userId);
}
