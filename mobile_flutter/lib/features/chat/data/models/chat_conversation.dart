/// A normalized item in the chat list, merged from two backend sources:
/// `GET /api/chat/groups` (group chats) and `GET /api/chat/private/list`
/// (1-1 chats). The web sidebar shows both in one list sorted by
/// `lastMessageAt` — we mirror that here.
class ChatConversation {
  /// The chat group id (used everywhere as the conversation id).
  final int id;

  /// `GROUP` or `PRIVATE`.
  final String type;

  /// Display name: group title, or the peer's full name for private chats.
  final String name;

  /// Peer avatar (private chats only; groups have none).
  final String? avatarUrl;

  /// Peer member id (private chats only) — needed for block/unblock.
  final int? peerMemberId;

  /// Last message preview text.
  final String? preview;

  /// ISO-8601 timestamp of the last message (used for sorting & display).
  final String? lastMessageAt;

  /// Number of members (group chats only).
  final int? memberCount;

  /// Block flags (private chats only).
  final bool blockedByMe;
  final bool blockedByPeer;

  const ChatConversation({
    required this.id,
    required this.type,
    required this.name,
    this.avatarUrl,
    this.peerMemberId,
    this.preview,
    this.lastMessageAt,
    this.memberCount,
    this.blockedByMe = false,
    this.blockedByPeer = false,
  });

  bool get isGroup => type == 'GROUP';
  bool get isPrivate => type == 'PRIVATE';

  /// Parsed timestamp for sorting; null timestamps sort last.
  DateTime? get lastAt =>
      lastMessageAt == null ? null : DateTime.tryParse(lastMessageAt!);

  factory ChatConversation.fromGroupJson(Map<String, dynamic> json) {
    return ChatConversation(
      id: (json['id'] as num).toInt(),
      type: 'GROUP',
      name: (json['title'] as String?)?.trim().isNotEmpty == true
          ? json['title'] as String
          : 'Nhóm chat',
      memberCount: (json['memberCount'] as num?)?.toInt(),
      preview: json['lastMessagePreview'] as String?,
      lastMessageAt: json['lastMessageAt'] as String?,
    );
  }

  factory ChatConversation.fromPrivateJson(Map<String, dynamic> json) {
    return ChatConversation(
      id: (json['id'] as num).toInt(),
      type: 'PRIVATE',
      name: json['peerFullName'] as String? ?? 'Người dùng',
      avatarUrl: json['peerAvatarUrl'] as String?,
      peerMemberId: (json['peerMemberId'] as num?)?.toInt(),
      preview: json['lastMessagePreview'] as String?,
      lastMessageAt: json['lastMessageAt'] as String?,
      blockedByMe: json['blockedByMe'] as bool? ?? false,
      blockedByPeer: json['blockedByPeer'] as bool? ?? false,
    );
  }
}
