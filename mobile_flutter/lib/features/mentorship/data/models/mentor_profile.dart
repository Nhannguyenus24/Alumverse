/// Mentor profile from `MentorProfileResponse`. `memberId` is the mentor's
/// organization-member id used as the path param for profile/booking calls.
class MentorProfile {
  final int memberId;
  final String? fullName;
  final String? avatarUrl;
  final String? currentJobTitle;
  final String? currentCompany;
  final String? bio;
  final double? ratingAvg;
  final int totalSessions;
  final String? status;
  final String? coverUrl;
  final List<String> expertiseTopics;

  const MentorProfile({
    required this.memberId,
    this.fullName,
    this.avatarUrl,
    this.currentJobTitle,
    this.currentCompany,
    this.bio,
    this.ratingAvg,
    this.totalSessions = 0,
    this.status,
    this.coverUrl,
    this.expertiseTopics = const [],
  });

  /// "Title @ Company" line, falling back to a generic label.
  String get roleLine {
    final parts = [
      currentJobTitle,
      currentCompany,
    ].where((e) => e != null && e.isNotEmpty);
    return parts.isEmpty ? 'Mentor' : parts.join(' @ ');
  }

  String get displayName => fullName ?? 'Mentor #$memberId';

  factory MentorProfile.fromJson(Map<String, dynamic> json) {
    return MentorProfile(
      memberId: (json['memberId'] as num).toInt(),
      fullName: json['fullName'] as String?,
      avatarUrl: json['avatarUrl'] as String?,
      currentJobTitle: json['currentJobTitle'] as String?,
      currentCompany: json['currentCompany'] as String?,
      bio: json['bio'] as String?,
      ratingAvg: (json['ratingAvg'] as num?)?.toDouble(),
      totalSessions: (json['totalSessions'] as num?)?.toInt() ?? 0,
      status: json['status'] as String?,
      coverUrl: json['coverUrl'] as String?,
      expertiseTopics:
          (json['expertiseTopics'] as List?)
              ?.map((e) => e.toString())
              .toList() ??
          const [],
    );
  }
}
