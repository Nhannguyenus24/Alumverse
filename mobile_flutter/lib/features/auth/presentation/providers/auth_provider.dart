import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../organization/presentation/providers/organization_provider.dart';
import '../../data/models/auth_user.dart';
import '../../data/repositories/auth_repository.dart';

/// Authenticated session state exposed to the UI. `user == null` means signed
/// out. `verificationLevel` is the organization-scoped level from login.
class AuthState {
  final AuthUser? user;
  final int? verificationLevel;

  const AuthState({this.user, this.verificationLevel});

  bool get isLoggedIn => user != null;

  static const AuthState signedOut = AuthState();
}

final authStateProvider =
    AsyncNotifierProvider<AuthNotifier, AuthState>(AuthNotifier.new);

class AuthNotifier extends AsyncNotifier<AuthState> {
  AuthRepository get _repo => ref.read(authRepositoryProvider);

  @override
  Future<AuthState> build() async {
    final session = await _repo.restoreSession();
    if (session == null) return AuthState.signedOut;
    return AuthState(
      user: session.user,
      verificationLevel: session.verificationLevel,
    );
  }

  /// Organization the user is signing in to. Login/register require it.
  int? get _organizationId =>
      ref.read(organizationStateProvider).valueOrNull?.id;

  Future<void> login(String email, String password) async {
    final orgId = _organizationId;
    if (orgId == null) {
      state = AsyncError(
        Exception('Vui lòng chọn tổ chức trước khi đăng nhập'),
        StackTrace.current,
      );
      return;
    }
    state = const AsyncLoading();
    state = await AsyncValue.guard(() async {
      final session = await _repo.login(
        email: email,
        password: password,
        organizationId: orgId,
      );
      return AuthState(
        user: session.user,
        verificationLevel: session.verificationLevel,
      );
    });
  }

  Future<void> loginWithGoogle(String idToken) async {
    final orgId = _organizationId;
    if (orgId == null) {
      state = AsyncError(
        Exception('Vui lòng chọn tổ chức trước khi đăng nhập'),
        StackTrace.current,
      );
      return;
    }
    state = const AsyncLoading();
    state = await AsyncValue.guard(() async {
      final session = await _repo.loginWithGoogle(
        idToken: idToken,
        organizationId: orgId,
      );
      return AuthState(
        user: session.user,
        verificationLevel: session.verificationLevel,
      );
    });
  }

  /// Creates the account (step 1 of signup). Does NOT sign the user in — the
  /// account is inactive until [verifyOtp] succeeds. Throws on failure so the
  /// page can surface the message; auth state is left unchanged.
  Future<void> register({
    required String email,
    required String userName,
    required String fullName,
    required String password,
  }) async {
    final orgId = _organizationId;
    if (orgId == null) {
      throw Exception('Vui lòng chọn tổ chức trước khi đăng ký');
    }
    await _repo.register(
      email: email,
      userName: userName,
      fullName: fullName,
      password: password,
      organizationId: orgId,
    );
  }

  Future<void> sendOtp(String email) => _repo.sendOtp(email);

  /// Verifies the OTP and activates the account (step 2 of signup).
  Future<void> verifyOtp({required String email, required String otp}) =>
      _repo.verifyOtp(email: email, otp: otp);

  Future<void> logout() async {
    await _repo.logout();
    state = const AsyncData(AuthState.signedOut);
  }
}
