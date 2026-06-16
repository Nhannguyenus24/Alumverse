/// Registration payload. Maps to the backend `RegisterRequest`:
/// `studentId` carries the student id. `organizationId` is required.
class RegisterRequest {
  final String email;
  final String studentId;
  final String fullName;
  final String password;
  final int organizationId;

  const RegisterRequest({
    required this.email,
    required this.studentId,
    required this.fullName,
    required this.password,
    required this.organizationId,
  });

  Map<String, dynamic> toJson() => {
        'email': email,
        'studentId': studentId,
        'fullName': fullName,
        'password': password,
        'organizationId': organizationId,
      };
}
