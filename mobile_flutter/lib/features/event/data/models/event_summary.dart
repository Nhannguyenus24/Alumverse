/// Event as returned by `/api/events/*` (the backend `events` table entity).
class EventSummary {
  final int id;
  final String title;
  final String? description;
  final String? bannerUrl;
  final String? location;
  final DateTime? startTime;
  final DateTime? endTime;
  final int interestedCount;
  final int joinedCount;
  final int? maxCapacity;
  final String? organizer;
  final String? topic;

  const EventSummary({
    required this.id,
    required this.title,
    this.description,
    this.bannerUrl,
    this.location,
    this.startTime,
    this.endTime,
    this.interestedCount = 0,
    this.joinedCount = 0,
    this.maxCapacity,
    this.organizer,
    this.topic,
  });

  factory EventSummary.fromJson(Map<String, dynamic> json) {
    return EventSummary(
      id: (json['id'] as num).toInt(),
      title: json['title'] as String? ?? '',
      description: json['description'] as String?,
      bannerUrl: json['bannerUrl'] as String?,
      location: json['location'] as String?,
      startTime: _date(json['startTime']),
      endTime: _date(json['endTime']),
      interestedCount: (json['interestedCount'] as num?)?.toInt() ?? 0,
      joinedCount: ((json['joinedCount'] ?? json['registeredCount']) as num?)?.toInt() ?? 0,
      maxCapacity: (json['maxCapacity'] as num?)?.toInt(),
      organizer: json['organizer'] as String?,
      topic: json['topic'] as String?,
    );
  }

  static DateTime? _date(Object? v) =>
      v is String && v.isNotEmpty ? DateTime.tryParse(v) : null;
}
