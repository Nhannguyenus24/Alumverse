import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/constants/api_endpoints.dart';
import '../../../../core/network/dio_client.dart';
import '../models/notification_item.dart';
import '../models/notification_settings.dart';
import '../models/user_profile.dart';

final userApiProvider = Provider<UserApi>((ref) {
  return UserApi(ref.watch(dioProvider));
});

/// Transport over the `/api/users/me/*` endpoints (profile, notification
/// settings, notifications). The organization is resolved server-side from the
/// JWT for reads; profile update still requires organizationId in the body.
class UserApi {
  UserApi(this._dio);

  final Dio _dio;

  Future<UserProfile> getProfile() async {
    final res = await _dio.get(ApiEndpoints.meProfile);
    return UserProfile.fromJson(_unwrap(res.data));
  }

  /// Whether the current user is a trusted verifier in [organizationId] — only
  /// trusted verifiers may vouch for other members. Reads `isTrustedVerifier`
  /// from `GET /users/me/organization-member`.
  Future<bool> isTrustedVerifier(int organizationId) async {
    final res = await _dio.get(
      ApiEndpoints.meOrganizationMember,
      queryParameters: {'organizationId': organizationId},
    );
    final data = res.data is Map ? res.data['data'] : res.data;
    if (data is Map) {
      final v = data['isTrustedVerifier'];
      if (v is bool) return v;
    }
    return false;
  }

  /// The current user's `verificationLevel` in [organizationId] (0 = unverified
  /// email, 1 = email verified, 2+ = academic/org verified). Reads from the
  /// same `GET /users/me/organization-member` record web uses to gate mentee
  /// signup.
  Future<int> getMyVerificationLevel(int organizationId) async {
    final res = await _dio.get(
      ApiEndpoints.meOrganizationMember,
      queryParameters: {'organizationId': organizationId},
    );
    final data = res.data is Map ? res.data['data'] : res.data;
    if (data is Map) {
      final v = data['verificationLevel'];
      if (v is int) return v;
      if (v is num) return v.toInt();
    }
    return 0;
  }

  /// Update profile. The backend requires organizationId; academic fields are
  /// optional lists. [extra] carries optional bio/phone/gender etc.
  Future<void> updateProfile({
    required int organizationId,
    String? phone,
    String? gender,
    String? bio,
  }) {
    return _dio.put(
      ApiEndpoints.meProfile,
      data: {
        'organizationId': organizationId,
        if (phone != null) 'phone': phone,
        if (gender != null) 'gender': gender,
        if (bio != null) 'bio': bio,
      },
    );
  }

  /// Upload a base64 image (may include the `data:image/...;base64,` header)
  /// and return the stored image URL.
  Future<String> uploadImage(String base64String) async {
    final res = await _dio.post(
      ApiEndpoints.imageUpload,
      data: {'base64String': base64String},
    );
    final data = res.data is Map ? res.data['data'] : res.data;
    return data?.toString() ?? '';
  }

  /// Set the current user's avatar to an already-uploaded image URL.
  Future<void> updateAvatar(String avatarUrl) {
    return _dio.put(ApiEndpoints.meAvatar, data: {'avatarUrl': avatarUrl});
  }

  Future<NotificationSettings> getNotificationSettings() async {
    final res = await _dio.get(ApiEndpoints.meNotificationSettings);
    return NotificationSettings.fromJson(_unwrap(res.data));
  }

  Future<void> updateNotificationSettings(NotificationSettings settings) {
    return _dio.put(
      ApiEndpoints.meNotificationSettings,
      data: settings.toJson(),
    );
  }

  Future<List<NotificationItem>> getNotifications() async {
    final res = await _dio.get(ApiEndpoints.meNotifications);
    final data = res.data is Map ? res.data['data'] : res.data;
    if (data is! List) return const [];
    return data
        .map((e) => NotificationItem.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<void> markRead(String id) =>
      _dio.put(ApiEndpoints.meNotificationRead(id));

  Future<void> deleteNotification(String id) =>
      _dio.delete(ApiEndpoints.meNotificationDelete(id));

  Future<void> deleteAllNotifications() =>
      _dio.delete(ApiEndpoints.meNotifications);

  Future<UserProfile> getPublicProfile(int userId) async {
    final res = await _dio.get(ApiEndpoints.publicProfile(userId));
    return UserProfile.fromJson(_unwrap(res.data));
  }

  Map<String, dynamic> _unwrap(dynamic body) {
    if (body is Map && body['data'] is Map) {
      return body['data'] as Map<String, dynamic>;
    }
    return body as Map<String, dynamic>;
  }
}
