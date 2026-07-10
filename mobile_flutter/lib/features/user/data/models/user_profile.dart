import 'dart:convert';

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
  final String? organizationName;
  final List<String> startedYear;
  final List<String> graduatedYear;
  final List<String> graduationStatus;
  final List<String> program;
  final List<String> major;
  final List<String> faculty;
  final List<String> department;

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
    this.organizationName,
    this.startedYear = const [],
    this.graduatedYear = const [],
    this.graduationStatus = const [],
    this.program = const [],
    this.major = const [],
    this.faculty = const [],
    this.department = const [],
  });

  bool get hasAcademicInfo =>
      organizationName != null ||
      startedYear.isNotEmpty ||
      graduatedYear.isNotEmpty ||
      graduationStatus.isNotEmpty ||
      program.isNotEmpty ||
      major.isNotEmpty ||
      faculty.isNotEmpty ||
      department.isNotEmpty;

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
      organizationName: json['organizationName'] as String?,
      startedYear: _stringList(json['startedYear']),
      graduatedYear: _stringList(json['graduatedYear']),
      graduationStatus: _stringList(json['graduationStatus']),
      program: _stringList(json['program']),
      major: _stringList(json['major']),
      faculty: _stringList(json['faculty']),
      department: _stringList(json['department']),
    );
  }

  static List<String> _stringList(dynamic value) {
    if (value == null) return const [];
    if (value is List) {
      return value
          .where((e) => e != null)
          .map((e) => e.toString().trim())
          .where((e) => e.isNotEmpty)
          .toList();
    }
    if (value is String) {
      final trimmed = value.trim();
      if (trimmed.isEmpty) return const [];
      try {
        final decoded = jsonDecode(trimmed);
        if (decoded is List) return _stringList(decoded);
      } catch (_) {}
      return [trimmed];
    }
    return [value.toString()];
  }
}
