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

  Future<LoginResponse> loginWithGoogle(String idToken, int organizationId) async {
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

  Future<void> logout() => _dio.post(ApiEndpoints.authLogout);
}
