/// A member of a group chat (`GET /api/chat/groups/{id}/members`).
class ChatGroupMember {
  final int memberId;
  final String fullName;
  final String? avatarUrl;
  final String role; // OWNER | MEMBER
  final String? joinedAt;

  const ChatGroupMember({
    required this.memberId,
    required this.fullName,
    this.avatarUrl,
    required this.role,
    this.joinedAt,
  });

  bool get isOwner => role == 'OWNER';

  factory ChatGroupMember.fromJson(Map<String, dynamic> json) {
    return ChatGroupMember(
      memberId: (json['memberId'] as num).toInt(),
      fullName: json['fullName'] as String? ?? '',
      avatarUrl: json['avatarUrl'] as String?,
      role: json['role'] as String? ?? 'MEMBER',
      joinedAt: json['joinedAt'] as String?,
    );
  }
}
