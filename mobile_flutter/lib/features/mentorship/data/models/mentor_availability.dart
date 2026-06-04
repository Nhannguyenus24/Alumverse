/// A bookable time slot from `MentorAvailabilityResponse`.
class MentorAvailability {
  final int id;
  final int? mentorMemberId;
  final DateTime startTime;
  final DateTime endTime;
  final String? status;

  const MentorAvailability({
    required this.id,
    this.mentorMemberId,
    required this.startTime,
    required this.endTime,
    this.status,
  });

  factory MentorAvailability.fromJson(Map<String, dynamic> json) {
    return MentorAvailability(
      id: (json['id'] as num).toInt(),
      mentorMemberId: (json['mentorMemberId'] as num?)?.toInt(),
      startTime: DateTime.parse(json['startTime'] as String),
      endTime: DateTime.parse(json['endTime'] as String),
      status: json['status'] as String?,
    );
  }
}
