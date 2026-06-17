import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../data/models/notification_item.dart';
import '../../data/models/notification_settings.dart';
import '../../data/models/user_profile.dart';
import '../../data/repositories/user_repository.dart';

final myProfileProvider = FutureProvider<UserProfile>((ref) {
  return ref.watch(userRepositoryProvider).getProfile();
});

final notificationSettingsProvider =
    FutureProvider<NotificationSettings>((ref) {
  return ref.watch(userRepositoryProvider).getNotificationSettings();
});

final notificationsProvider = FutureProvider<List<NotificationItem>>((ref) {
  return ref.watch(userRepositoryProvider).getNotifications();
});
