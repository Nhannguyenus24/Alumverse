import 'package:jwt_decoder/jwt_decoder.dart';

import '../../features/auth/data/models/auth_user.dart';

/// Decode JWT claims on the client to build the auth user.
/// Mirrors the web client (`frontend/src/utils/jwt.js`): the backend issues
/// the access token with claims `sub, email, studentId, avatar, role,
/// organizationId`. This is for reading claims only — the backend validates
/// the token for any security decision.
class JwtHelper {
  JwtHelper._();

  static Map<String, dynamic>? _tryDecode(String? token) {
    if (token == null || token.isEmpty) return null;
    try {
      return JwtDecoder.decode(token);
    } catch (_) {
      return null;
    }
  }

  /// Build an [AuthUser] from the access token, or null if it cannot be read.
  static AuthUser? userFromAccessToken(String? token) {
    final claims = _tryDecode(token);
    if (claims == null || claims['sub'] == null) return null;
    return AuthUser(
      id: claims['sub'].toString(),
      email: (claims['email'] as String?) ?? '',
      fullName: claims['fullName'] as String?,
      avatarUrl: claims['avatar'] as String? ?? claims['avatarUrl'] as String?,
      role: claims['role'] as String?,
      organizationId: _asInt(claims['organizationId']),
    );
  }

  /// Organization id embedded in the access token, if any.
  static int? organizationIdFromToken(String? token) {
    final claims = _tryDecode(token);
    return _asInt(claims?['organizationId']);
  }

  /// True when the token is missing, malformed, or expired (with [skew] leeway
  /// so we treat it as expired slightly early to avoid a server-clock race).
  static bool isExpired(String? token, {Duration skew = const Duration(seconds: 60)}) {
    if (token == null || token.isEmpty) return true;
    try {
      final exp = JwtDecoder.getExpirationDate(token);
      return DateTime.now().add(skew).isAfter(exp);
    } catch (_) {
      return true;
    }
  }

  static int? _asInt(Object? value) {
    if (value is int) return value;
    if (value is num) return value.toInt();
    if (value is String) return int.tryParse(value);
    return null;
  }
}
