import 'package:easy_localization/easy_localization.dart';
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

final authStateProvider = AsyncNotifierProvider<AuthNotifier, AuthState>(
  AuthNotifier.new,
);

/// Roles allowed to run event check-in (mirrors the web admin gate, which
/// admits ADMIN/MODERATOR; STAFF is included for on-site organizers).
const _checkInRoles = {'ADMIN', 'MODERATOR', 'STAFF'};

/// True when the signed-in user may access admin-only tools (event check-in).
/// Derived from the JWT `role` claim exposed on [AuthUser].
final isStaffProvider = Provider<bool>((ref) {
  final role =
      ref.watch(authStateProvider).valueOrNull?.user?.role?.toUpperCase();
  return role != null && _checkInRoles.contains(role);
});

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
        Exception('auth.select_org_first'.tr()),
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
        Exception('auth.select_org_first'.tr()),
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
    required String studentId,
    required String fullName,
    required String password,
  }) async {
    final orgId = _organizationId;
    if (orgId == null) {
      throw Exception('auth.select_org_before_register'.tr());
    }
    await _repo.register(
      email: email,
      studentId: studentId,
      fullName: fullName,
      password: password,
      organizationId: orgId,
    );
  }

  Future<void> sendOtp(String email) => _repo.sendOtp(email);

  /// Verifies the OTP and activates the account (step 2 of signup).
  Future<void> verifyOtp({required String email, required String otp}) =>
      _repo.verifyOtp(email: email, otp: otp);

  /// Forgot password: sends a recovery OTP to [email]. Does not touch auth
  /// state; throws on failure so the page can surface the message.
  Future<void> forgotPassword(String email) => _repo.forgotPassword(email);

  /// Changes the signed-in user's password. Requires an active session;
  /// throws if signed out or the request fails. Auth state is left unchanged.
  Future<void> changePassword({
    required String oldPassword,
    required String newPassword,
  }) async {
    final userId = state.valueOrNull?.user?.id;
    if (userId == null) {
      throw Exception('auth.login_required_change_password'.tr());
    }
    final parsedId = int.tryParse(userId);
    if (parsedId == null) {
      throw Exception('auth.invalid_account'.tr());
    }
    await _repo.changePassword(
      userId: parsedId,
      oldPassword: oldPassword,
      newPassword: newPassword,
    );
  }

  Future<void> logout() async {
    await _repo.logout();
    state = const AsyncData(AuthState.signedOut);
  }
}
