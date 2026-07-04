import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/constants/api_endpoints.dart';
import '../../../../core/network/dio_client.dart';
import '../models/login_request.dart';
import '../models/login_response.dart';
import '../models/register_request.dart';

final authApiProvider = Provider<AuthApi>((ref) {
  return AuthApi(ref.watch(dioProvider));
});

/// Thin transport over the `/api/auth/*` endpoints. Responses are unwrapped
/// from the `ApiResponse { message, data }` envelope by [LoginResponse].
class AuthApi {
  AuthApi(this._dio);

  final Dio _dio;

  Future<LoginResponse> login(LoginRequest request) async {
    final res = await _dio.post(ApiEndpoints.authLogin, data: request.toJson());
    return LoginResponse.fromJson(res.data as Map<String, dynamic>);
  }

  Future<LoginResponse> loginWithGoogle(
    String idToken,
    int organizationId,
  ) async {
    final res = await _dio.post(
      ApiEndpoints.authGoogleLogin,
      data: {'idToken': idToken, 'organizationId': organizationId},
    );
    return LoginResponse.fromJson(res.data as Map<String, dynamic>);
  }

  /// Registers the account. Returns nothing meaningful on success — the account
  /// is created but inactive until OTP verification.
  Future<void> register(RegisterRequest request) =>
      _dio.post(ApiEndpoints.authRegister, data: request.toJson());

  /// Sends an OTP to [email] (used for both signup verification and resend).
  Future<void> sendOtp(String email) =>
      _dio.post(ApiEndpoints.authSendOtp, data: {'email': email});

  /// Verifies the OTP and activates the account.
  Future<void> verifyOtp(String email, String otp) =>
      _dio.post(ApiEndpoints.authVerifyOtp, data: {'email': email, 'otp': otp});

  /// "Forgot password": mirrors the web flow, which simply sends a recovery
  /// OTP to the registered email (`POST /auth/send-otp`).
  Future<void> forgotPassword(String email) =>
      _dio.post(ApiEndpoints.authSendOtp, data: {'email': email});

  /// Changes the password for the signed-in user
  /// (`PUT /auth/password/{userId}`). The backend only exposes the
  /// old-password flow — same as the web `resetPassword`.
  Future<void> changePassword({
    required int userId,
    required String oldPassword,
    required String newPassword,
  }) => _dio.put(
    ApiEndpoints.authChangePassword(userId),
    data: {'oldPassword': oldPassword, 'newPassword': newPassword},
  );

  Future<void> logout() => _dio.post(ApiEndpoints.authLogout);
}
