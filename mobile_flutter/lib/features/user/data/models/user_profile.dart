/// Current user's profile (`GET /api/users/me/profile`). Mirrors the backend
/// `UserProfileResponse`.
class UserProfile {
  final int? userId;
  final String email;
  final String? studentId;
  final String? role;
  final String? status;
  final String? avatarUrl;
  final String? fullName;
  final String? phone;
  final String? bio;
  final String? dob; // ISO date string
  final String? gender;

  const UserProfile({
    this.userId,
    this.email = '',
    this.studentId,
    this.role,
    this.status,
    this.avatarUrl,
    this.fullName,
    this.phone,
    this.bio,
    this.dob,
    this.gender,
  });

  factory UserProfile.fromJson(Map<String, dynamic> json) {
    return UserProfile(
      userId: (json['userId'] as num?)?.toInt(),
      email: json['email'] as String? ?? '',
      studentId: json['studentId'] as String?,
      role: json['role'] as String?,
      status: json['status'] as String?,
      avatarUrl: json['avatarUrl'] as String?,
      fullName: json['fullName'] as String?,
      phone: json['phone'] as String?,
      bio: json['bio'] as String?,
      dob: json['dob'] as String?,
      gender: json['gender'] as String?,
    );
  }
}
