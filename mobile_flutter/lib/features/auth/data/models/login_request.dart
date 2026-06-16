/// Login payload. `organizationId` is required by the backend to scope the
/// user to a tenant and to compute the verification level. `email` accepts
/// only an email.
class LoginRequest {
  final String email;
  final String password;
  final int organizationId;

  const LoginRequest({
    required this.email,
    required this.password,
    required this.organizationId,
  });

  Map<String, dynamic> toJson() => {
        'email': email,
        'password': password,
        'organizationId': organizationId,
      };
}
