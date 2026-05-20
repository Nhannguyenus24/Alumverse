import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/constants/api_endpoints.dart';
import '../../../../core/network/dio_client.dart';
import '../models/login_request.dart';
import '../models/login_response.dart';

final authApiProvider = Provider<AuthApi>((ref) {
  return AuthApi(ref.watch(dioProvider));
});

class AuthApi {
  AuthApi(this._dio);

  final Dio _dio;

  Future<LoginResponse> login(LoginRequest request) async {
    final res = await _dio.post(
      ApiEndpoints.authLogin,
      data: request.toJson(),
    );
    return LoginResponse.fromJson(res.data as Map<String, dynamic>);
  }

  Future<LoginResponse> loginWithGoogle(String idToken) async {
    final res = await _dio.post(
      ApiEndpoints.authGoogle,
      data: {'idToken': idToken},
    );
    return LoginResponse.fromJson(res.data as Map<String, dynamic>);
  }

  Future<void> logout() => _dio.post(ApiEndpoints.authLogout);

  Future<LoginResponse> refresh(String refreshToken) async {
    final res = await _dio.post(
      ApiEndpoints.authRefresh,
      data: {'refreshToken': refreshToken},
    );
    return LoginResponse.fromJson(res.data as Map<String, dynamic>);
  }
}
