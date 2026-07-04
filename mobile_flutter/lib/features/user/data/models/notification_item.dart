/// A user notification (`GET /api/users/me/notifications`).
class NotificationItem {
  final String id;
  final String? title;
  final String message;
  final bool isRead;
  final DateTime? createdAt;
  final String? link;

  const NotificationItem({
    required this.id,
    this.title,
    this.message = '',
    this.isRead = false,
    this.createdAt,
    this.link,
  });

  NotificationItem copyWith({bool? isRead}) => NotificationItem(
    id: id,
    title: title,
    message: message,
    isRead: isRead ?? this.isRead,
    createdAt: createdAt,
    link: link,
  );

  factory NotificationItem.fromJson(Map<String, dynamic> json) {
    return NotificationItem(
      id: json['id'].toString(),
      title: json['title'] as String?,
      message: json['message'] as String? ?? '',
      isRead: json['isRead'] as bool? ?? false,
      createdAt:
          json['createdAt'] is String
              ? DateTime.tryParse(json['createdAt'] as String)
              : null,
      link: json['link'] as String?,
    );
  }
}
