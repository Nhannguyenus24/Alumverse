/// A booked mentorship session from `MentorshipSessionResponse`. Enriched
/// fields (mentor name/avatar, slot times) are populated when the backend
/// joins them; treat them as optional.
class MentorshipSession {
  final int id;
  final int? availabilityId;
  final int? menteeMemberId;
  final int? mentorMemberId;
  final String? status;
  final String? sessionType;
  final String? bookingNote;
  final String? meetingLink;
  final String? introduction;
  final String? description;
  final DateTime? startTime;
  final DateTime? endTime;
  final String? mentorName;
  final String? mentorAvatarUrl;
  final String? menteeName;
  final String? menteeAvatarUrl;
  final DateTime? createdAt;

  const MentorshipSession({
    required this.id,
    this.availabilityId,
    this.menteeMemberId,
    this.mentorMemberId,
    this.status,
    this.sessionType,
    this.bookingNote,
    this.meetingLink,
    this.introduction,
    this.description,
    this.startTime,
    this.endTime,
    this.mentorName,
    this.mentorAvatarUrl,
    this.menteeName,
    this.menteeAvatarUrl,
    this.createdAt,
  });

  factory MentorshipSession.fromJson(Map<String, dynamic> json) {
    return MentorshipSession(
      id: (json['id'] as num).toInt(),
      availabilityId: (json['availabilityId'] as num?)?.toInt(),
      menteeMemberId: (json['menteeMemberId'] as num?)?.toInt(),
      mentorMemberId: (json['mentorMemberId'] as num?)?.toInt(),
      status: json['status'] as String?,
      sessionType: json['sessionType'] as String?,
      bookingNote: json['bookingNote'] as String?,
      meetingLink: json['meetingLink'] as String?,
      introduction: json['introduction'] as String?,
      description: json['description'] as String?,
      startTime: _date(json['startTime']),
      endTime: _date(json['endTime']),
      mentorName: json['mentorName'] as String?,
      mentorAvatarUrl: json['mentorAvatarUrl'] as String?,
      menteeName: json['menteeName'] as String?,
      menteeAvatarUrl: json['menteeAvatarUrl'] as String?,
      createdAt: _date(json['createdAt']),
    );
  }

  static DateTime? _date(Object? v) =>
      v is String && v.isNotEmpty ? DateTime.tryParse(v) : null;
}
