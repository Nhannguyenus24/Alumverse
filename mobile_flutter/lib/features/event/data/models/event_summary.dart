/// Event as returned by `/api/events/*` (the backend `events` table entity).
class EventSummary {
  final int id;
  final String title;
  final String? description;
  final String? bannerUrl;
  final String? location;
  final DateTime? startTime;
  final DateTime? endTime;
  final DateTime? registrationStartAt;
  final DateTime? registrationEndAt;
  final int interestedCount;
  final int joinedCount;
  final int? maxCapacity;
  final String? organizer;
  final String? topic;
  final bool requiresCheckIn;
  final bool isPublished;

  const EventSummary({
    required this.id,
    required this.title,
    this.description,
    this.bannerUrl,
    this.location,
    this.startTime,
    this.endTime,
    this.registrationStartAt,
    this.registrationEndAt,
    this.interestedCount = 0,
    this.joinedCount = 0,
    this.maxCapacity,
    this.organizer,
    this.topic,
    this.requiresCheckIn = false,
    this.isPublished = false,
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
      registrationStartAt: _date(json['registrationStartAt']),
      registrationEndAt: _date(json['registrationEndAt']),
      interestedCount: (json['interestedCount'] as num?)?.toInt() ?? 0,
      joinedCount: ((json['joinedCount'] ?? json['registeredCount']) as num?)?.toInt() ?? 0,
      maxCapacity: (json['maxCapacity'] as num?)?.toInt(),
      organizer: json['organizer'] as String?,
      topic: json['topic'] as String?,
      requiresCheckIn: (json['requiresCheckIn'] as bool?) ?? false,
      isPublished: (json['isPublished'] as bool?) ?? false,
    );
  }

  /// Parse a date from the API. Jackson may serialise `LocalDateTime` either as
  /// an ISO string ("2026-07-20T17:04:00") or, depending on config, as an array
  /// `[year, month, day, hour, minute, second, nanos]`. Handle both (plus epoch
  /// millis) so the event time always shows.
  static DateTime? _date(Object? v) {
    if (v == null) return null;
    if (v is String) return v.isEmpty ? null : DateTime.tryParse(v);
    if (v is int) return DateTime.fromMillisecondsSinceEpoch(v);
    if (v is List && v.length >= 3) {
      int at(int i) => i < v.length ? (v[i] as num).toInt() : 0;
      final ns = v.length > 6 ? (v[6] as num).toInt() : 0;
      return DateTime(
        at(0), at(1), at(2), at(3), at(4), at(5), (ns / 1000000).round(),
      );
    }
    return null;
  }
}
