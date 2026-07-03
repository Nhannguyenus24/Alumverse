import 'dart:convert';

/// A single chat message. The same shape is returned by the REST history
/// endpoint (`GET /api/chat/groups/{id}/messages`, `ChatMessageResponse`) and
/// by the WebSocket `MESSAGE_CREATED` broadcast payload — so one [fromJson]
/// serves both.
class ChatMessage {
  final int id;
  final int groupId;
  final int senderMemberId;
  final String? senderFullName;
  final String? senderAvatarUrl;
  final String content;
  final String messageType; // TEXT | IMAGE | FILE | SYSTEM | VIDEO
  final dynamic metadata;
  final String? createdAt;
  final String? editedAt;
  final String? deletedAt;

  const ChatMessage({
    required this.id,
    required this.groupId,
    required this.senderMemberId,
    this.senderFullName,
    this.senderAvatarUrl,
    this.content = '',
    this.messageType = 'TEXT',
    this.metadata,
    this.createdAt,
    this.editedAt,
    this.deletedAt,
  });

  bool get isDeleted => deletedAt != null;

  /// [metadata] as returned by the WS/REST layer may be a JSON-encoded
  /// string instead of a decoded map — parse it safely either way.
  Map<String, dynamic>? get metadataMap {
    final raw = metadata;
    if (raw is Map<String, dynamic>) return raw;
    if (raw is Map) return raw.cast<String, dynamic>();
    if (raw is String && raw.isNotEmpty) {
      try {
        final decoded = jsonDecode(raw);
        if (decoded is Map) return decoded.cast<String, dynamic>();
      } catch (_) {
        // ignore malformed metadata
      }
    }
    return null;
  }

  DateTime? get createdAtDate =>
      createdAt == null ? null : DateTime.tryParse(createdAt!);

  factory ChatMessage.fromJson(Map<String, dynamic> json) {
    return ChatMessage(
      id: (json['id'] as num).toInt(),
      groupId: (json['groupId'] as num).toInt(),
      senderMemberId: (json['senderMemberId'] as num).toInt(),
      senderFullName: json['senderFullName'] as String?,
      senderAvatarUrl: json['senderAvatarUrl'] as String?,
      content: json['content'] as String? ?? '',
      messageType: json['messageType'] as String? ?? 'TEXT',
      metadata: json['metadata'],
      createdAt: json['createdAt'] as String?,
      editedAt: json['editedAt'] as String?,
      deletedAt: json['deletedAt'] as String?,
    );
  }
}
