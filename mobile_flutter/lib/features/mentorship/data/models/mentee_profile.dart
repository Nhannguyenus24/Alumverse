
class MenteeProfile {
  final int memberId;
  final String mentoringGoal;
  final String major;
  final String academicYear;
  final String? interests;
  final bool isActive;

  const MenteeProfile({
    required this.memberId,
    required this.mentoringGoal,
    required this.major,
    required this.academicYear,
    this.interests,
    this.isActive = true,
  });

  factory MenteeProfile.fromJson(Map<String, dynamic> json) {
    return MenteeProfile(
      memberId: (json['memberId'] as num).toInt(),
      mentoringGoal: json['mentoringGoal'] as String? ?? '',
      major: json['major'] as String? ?? '',
      academicYear: json['academicYear'] as String? ?? '',
      interests: json['interests'] as String?,
      isActive: json['isActive'] as bool? ?? true,
    );
  }
}
