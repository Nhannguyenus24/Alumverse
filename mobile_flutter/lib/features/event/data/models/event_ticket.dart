/// A user's event registration ticket (`GET /api/events/my-tickets`).
class EventTicket {
  final int id;
  final int eventId;
  final String ticketCode;
  final String status;
  final DateTime? registeredAt;
  final DateTime? checkedInAt;
  final String? cancelReason;
  final String? rejectReason;
  final List<Map<String, dynamic>> registrationAnswers;
  // Optional event info if the backend embeds it; otherwise resolved separately.
  final String? eventTitle;
  // Attendee identity — shown on the admin check-in result.
  final int? memberId;
  final String? guestName;
  final String? guestEmail;

  const EventTicket({
    required this.id,
    required this.eventId,
    required this.ticketCode,
    required this.status,
    this.registeredAt,
    this.checkedInAt,
    this.cancelReason,
    this.rejectReason,
    this.registrationAnswers = const [],
    this.eventTitle,
    this.memberId,
    this.guestName,
    this.guestEmail,
  });

  /// Best-effort display name for the attendee (guest name → email → member id).
  String? get attendeeLabel {
    if (guestName != null && guestName!.trim().isNotEmpty) return guestName;
    if (guestEmail != null && guestEmail!.trim().isNotEmpty) return guestEmail;
    if (memberId != null) return '#$memberId';
    return null;
  }

  bool get isCancelled => status.toUpperCase() == 'CANCELLED';
  bool get isCheckedIn {
    final s = status.toUpperCase();
    return s == 'CHECKED_IN' || s == 'USED';
  }

  /// i18n key for the status label. Use `.tr()` in the UI layer.
  String get statusKey {
    switch (status.toUpperCase()) {
      case 'ISSUED':
      case 'ACTIVE':
        return 'event.ticket_status_registered';
      case 'CHECKED_IN':
      case 'USED':
        return 'event.ticket_status_attended';
      case 'CANCELLED':
        return 'event.ticket_status_cancelled';
      case 'PENDING':
        return 'event.ticket_status_pending';
      case 'REJECTED':
        return 'event.ticket_status_rejected';
      default:
        return 'event.ticket_status_registered';
    }
  }

  factory EventTicket.fromJson(Map<String, dynamic> json) {
    final answers = json['registrationAnswers'];
    return EventTicket(
      id: (json['id'] as num?)?.toInt() ?? 0,
      eventId: (json['eventId'] as num?)?.toInt() ?? 0,
      ticketCode: json['ticketCode']?.toString() ?? '',
      status: json['status']?.toString() ?? '',
      registeredAt: _date(json['registeredAt']),
      checkedInAt: _date(json['checkedInAt']),
      cancelReason: json['cancelReason'] as String?,
      rejectReason: json['rejectReason'] as String?,
      registrationAnswers: answers is List
          ? answers
              .whereType<Map>()
              .map((e) => e.cast<String, dynamic>())
              .toList()
          : const [],
      eventTitle: json['eventTitle'] as String? ??
          (json['event'] is Map ? json['event']['title'] as String? : null),
      memberId: (json['memberId'] as num?)?.toInt(),
      guestName: json['guestName'] as String?,
      guestEmail: json['guestEmail'] as String?,
    );
  }

  static DateTime? _date(dynamic v) =>
      v is String ? DateTime.tryParse(v) : null;
}
