/// Registration payload. Maps to the backend `RegisterRequest`:
/// `userName` carries the student id. `organizationId` is required.
class RegisterRequest {
  final String email;
  final String userName;
  final String fullName;
  final String password;
  final int organizationId;

  const RegisterRequest({
    required this.email,
    required this.userName,
    required this.fullName,
    required this.password,
    required this.organizationId,
  });

  Map<String, dynamic> toJson() => {
        'email': email,
        'userName': userName,
        'fullName': fullName,
        'password': password,
        'organizationId': organizationId,
      };
}
