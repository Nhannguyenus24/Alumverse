/// Recent chat preview item (`GET /api/chat/recent-previews`).
class ChatRecentPreview {
  final int id;
  final String name;
  final String? avatarUrl;
  final String? preview;
  final String? updatedAt;
  final String type; // PRIVATE | GROUP

  const ChatRecentPreview({
    required this.id,
    required this.name,
    this.avatarUrl,
    this.preview,
    this.updatedAt,
    required this.type,
  });

  DateTime? get updatedAtDate =>
      updatedAt != null ? DateTime.tryParse(updatedAt!) : null;

  bool get isGroup => type == 'GROUP';

  factory ChatRecentPreview.fromJson(Map<String, dynamic> json) {
    return ChatRecentPreview(
      id: (json['id'] as num).toInt(),
      name: json['name'] as String? ?? '',
      avatarUrl: json['avatarUrl'] as String?,
      preview: json['preview'] as String?,
      updatedAt: json['updatedAt'] as String?,
      type: json['type'] as String? ?? 'PRIVATE',
    );
  }
}
