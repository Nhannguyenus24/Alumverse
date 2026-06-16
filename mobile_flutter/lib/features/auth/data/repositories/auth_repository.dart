import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/storage/secure_storage.dart';
import '../../../../core/utils/jwt_helper.dart';
import '../datasources/auth_api.dart';
import '../models/auth_user.dart';
import '../models/login_request.dart';
import '../models/login_response.dart';
import '../models/register_request.dart';

final authRepositoryProvider = Provider<AuthRepository>((ref) {
  return AuthRepository(
    api: ref.watch(authApiProvider),
    storage: ref.watch(secureStorageProvider),
  );
});

/// Result of an authenticated session: the user (decoded from the JWT) plus
/// the organization-scoped verification level returned by the backend.
class AuthSession {
  final AuthUser user;
  final int? verificationLevel;

  const AuthSession({required this.user, this.verificationLevel});
}

class AuthRepository {
  AuthRepository({required this.api, required this.storage});

  final AuthApi api;
  final SecureStorage storage;

  Future<AuthSession> login({
    required String email,
    required String password,
    required int organizationId,
  }) async {
    final res = await api.login(LoginRequest(
      email: email,
      password: password,
      organizationId: organizationId,
    ));
    return _persistSession(res);
  }

  Future<AuthSession> loginWithGoogle({
    required String idToken,
    required int organizationId,
  }) async {
    final res = await api.loginWithGoogle(idToken, organizationId);
    return _persistSession(res);
  }

  /// Step 1 of signup: create the (inactive) account.
  Future<void> register({
    required String email,
    required String studentId,
    required String fullName,
    required String password,
    required int organizationId,
  }) {
    return api.register(RegisterRequest(
      email: email,
      studentId: studentId,
      fullName: fullName,
      password: password,
      organizationId: organizationId,
    ));
  }

  Future<void> sendOtp(String email) => api.sendOtp(email);

  /// Step 2 of signup: verify the OTP and activate the account.
  Future<void> verifyOtp({required String email, required String otp}) =>
      api.verifyOtp(email, otp);

  Future<void> logout() async {
    try {
      await api.logout();
    } catch (_) {
      // Best-effort: clear local state even if the server call fails.
    }
    await storage.clearAuth();
  }

  /// Restore a session from the persisted access token (app launch). Returns
  /// null when there is no token or it is expired.
  Future<AuthSession?> restoreSession() async {
    final token = await storage.readAccessToken();
    if (token == null || token.isEmpty || JwtHelper.isExpired(token)) {
      return null;
    }
    final user = JwtHelper.userFromAccessToken(token);
    if (user == null) return null;
    return AuthSession(
      user: user,
      verificationLevel: await storage.readVerificationLevel(),
    );
  }

  Future<AuthSession> _persistSession(LoginResponse res) async {
    final user = JwtHelper.userFromAccessToken(res.accessToken);
    if (user == null) {
      throw Exception('Invalid access token received from server');
    }
    await storage.writeAccessToken(res.accessToken);
    if (res.verificationLevel != null) {
      await storage.writeVerificationLevel(res.verificationLevel!);
    }
    return AuthSession(user: user, verificationLevel: res.verificationLevel);
  }
}
