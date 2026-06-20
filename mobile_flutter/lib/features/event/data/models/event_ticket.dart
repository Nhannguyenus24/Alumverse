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
  });

  bool get isCancelled => status.toUpperCase() == 'CANCELLED';
  bool get isCheckedIn {
    final s = status.toUpperCase();
    return s == 'CHECKED_IN' || s == 'USED';
  }

  /// Vietnamese status label for display.
  String get statusLabel {
    switch (status.toUpperCase()) {
      case 'ISSUED':
      case 'ACTIVE':
        return 'Đã đăng ký';
      case 'CHECKED_IN':
      case 'USED':
        return 'Đã tham dự';
      case 'CANCELLED':
        return 'Đã hủy';
      case 'PENDING':
        return 'Chờ duyệt';
      case 'REJECTED':
        return 'Bị từ chối';
      default:
        return status;
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
    );
  }

  static DateTime? _date(dynamic v) =>
      v is String ? DateTime.tryParse(v) : null;
}
