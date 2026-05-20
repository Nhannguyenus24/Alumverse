import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/storage/secure_storage.dart';
import '../datasources/auth_api.dart';
import '../models/auth_user.dart';
import '../models/login_request.dart';

final authRepositoryProvider = Provider<AuthRepository>((ref) {
  return AuthRepository(
    api: ref.watch(authApiProvider),
    storage: ref.watch(secureStorageProvider),
  );
});

class AuthRepository {
  AuthRepository({required this.api, required this.storage});

  final AuthApi api;
  final SecureStorage storage;

  Future<AuthUser> login(String email, String password) async {
    final res = await api.login(LoginRequest(email: email, password: password));
    await storage.writeAccessToken(res.accessToken);
    if (res.refreshToken != null) {
      await storage.writeRefreshToken(res.refreshToken!);
    }
    return res.user;
  }

  Future<AuthUser> loginWithGoogle(String idToken) async {
    final res = await api.loginWithGoogle(idToken);
    await storage.writeAccessToken(res.accessToken);
    if (res.refreshToken != null) {
      await storage.writeRefreshToken(res.refreshToken!);
    }
    return res.user;
  }

  Future<void> logout() async {
    try {
      await api.logout();
    } catch (_) {}
    await storage.clearAuth();
  }

  Future<bool> hasSession() async {
    final token = await storage.readAccessToken();
    return token != null && token.isNotEmpty;
  }
}
