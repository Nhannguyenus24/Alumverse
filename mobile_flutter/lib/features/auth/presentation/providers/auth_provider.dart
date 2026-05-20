import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../data/models/auth_user.dart';
import '../../data/repositories/auth_repository.dart';

final authStateProvider =
    AsyncNotifierProvider<AuthNotifier, AuthUser?>(AuthNotifier.new);

class AuthNotifier extends AsyncNotifier<AuthUser?> {
  @override
  Future<AuthUser?> build() async {
    final repo = ref.read(authRepositoryProvider);
    return await repo.hasSession() ? null : null;
  }

  Future<void> login(String email, String password) async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(() async {
      final repo = ref.read(authRepositoryProvider);
      return await repo.login(email, password);
    });
  }

  Future<void> loginWithGoogle(String idToken) async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(() async {
      final repo = ref.read(authRepositoryProvider);
      return await repo.loginWithGoogle(idToken);
    });
  }

  Future<void> logout() async {
    final repo = ref.read(authRepositoryProvider);
    await repo.logout();
    state = const AsyncData(null);
  }
}
