/// Body of a successful login/refresh, unwrapped from `ApiResponse.data`.
/// The backend returns only `{ accessToken, verificationLevel }`; the refresh
/// token is set as an HTTP-only cookie and the user is decoded from the JWT.
class LoginResponse {
  final String accessToken;
  final int? verificationLevel;
  final bool mustChangePassword;

  const LoginResponse({
    required this.accessToken,
    this.verificationLevel,
    this.mustChangePassword = false,
  });

  factory LoginResponse.fromJson(Map<String, dynamic> json) {
    // Unwrap ApiResponse { message, data } if the raw envelope is passed in.
    final data =
        (json['data'] is Map ? json['data'] : json) as Map<String, dynamic>;
    return LoginResponse(
      accessToken: (data['accessToken'] ?? data['access_token']) as String,
      verificationLevel:
          data['verificationLevel'] is num
              ? (data['verificationLevel'] as num).toInt()
              : null,
      mustChangePassword: data['mustChangePassword'] == true,
    );
  }
}
