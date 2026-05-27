import 'auth_user.dart';

class LoginResponse {
  final String accessToken;
  final String? refreshToken;
  final AuthUser user;

  const LoginResponse({
    required this.accessToken,
    this.refreshToken,
    required this.user,
  });

  factory LoginResponse.fromJson(Map<String, dynamic> json) {
    final data = (json['data'] ?? json) as Map<String, dynamic>;
    return LoginResponse(
      accessToken: (data['accessToken'] ?? data['access_token']) as String,
      refreshToken:
          (data['refreshToken'] ?? data['refresh_token']) as String?,
      user: AuthUser.fromJson(data['user'] as Map<String, dynamic>),
    );
  }
}
