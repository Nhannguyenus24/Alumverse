/// A member the current user has blocked (`GET /api/chat/blocks`).
class BlockedMember {
  final int blockedMemberId;
  final String fullName;
  final String? avatarUrl;
  final String? blockedAt;

  const BlockedMember({
    required this.blockedMemberId,
    required this.fullName,
    this.avatarUrl,
    this.blockedAt,
  });

  factory BlockedMember.fromJson(Map<String, dynamic> json) {
    return BlockedMember(
      blockedMemberId: (json['blockedMemberId'] as num).toInt(),
      fullName: json['fullName'] as String? ?? '',
      avatarUrl: json['avatarUrl'] as String?,
      blockedAt: json['blockedAt'] as String?,
    );
  }
}
