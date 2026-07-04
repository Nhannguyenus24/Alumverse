/// Decoded inbound WebSocket event from `/ws/chat`.
///
/// Server → client frames (see backend `ChatWebSocketHandler`):
///  - `MESSAGE_CREATED` → `{ payload: <ChatMessage json> }`
///  - `JOINED_GROUP` / `LEFT_GROUP` → `{ groupId, message }`
///  - `ERROR` → `{ message }`
class ChatSocketEvent {
  final String type;
  final Map<String, dynamic>? payload;
  final int? groupId;
  final String? message;

  const ChatSocketEvent({
    required this.type,
    this.payload,
    this.groupId,
    this.message,
  });

  factory ChatSocketEvent.fromJson(Map<String, dynamic> json) {
    final rawPayload = json['payload'];
    return ChatSocketEvent(
      type: json['type'] as String? ?? 'UNKNOWN',
      payload: rawPayload is Map ? rawPayload.cast<String, dynamic>() : null,
      groupId: (json['groupId'] as num?)?.toInt(),
      message: json['message'] as String?,
    );
  }
}

/// Builders for client → server frames. Kept as plain maps so the service can
/// JSON-encode them directly.
class ChatSocketOutbound {
  ChatSocketOutbound._();

  static Map<String, dynamic> joinGroup(int groupId) => {
    'type': 'JOIN_GROUP',
    'groupId': groupId,
  };

  static Map<String, dynamic> leaveGroup(int groupId) => {
    'type': 'LEAVE_GROUP',
    'groupId': groupId,
  };

  static Map<String, dynamic> sendMessage({
    required int groupId,
    required String content,
    required String chatType, // PRIVATE | GROUP
    String messageType = 'TEXT',
    Map<String, dynamic>? metadata,
  }) => {
    'type': 'SEND_MESSAGE',
    'groupId': groupId,
    'content': content,
    'chatType': chatType,
    'messageType': messageType,
    'metadata': metadata,
  };
}
