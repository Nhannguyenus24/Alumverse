/// Blocked-members banner context for a group chat
/// (`GET /api/chat/groups/{id}/blocked-members-context`,
/// `GroupBlockedMembersContextResponse`).
class GroupBlockedContext {
  final List<BlockedInGroup> blockedMembers;
  final String? currentUserRole; // OWNER | MEMBER | null

  const GroupBlockedContext({
    this.blockedMembers = const [],
    this.currentUserRole,
  });

  bool get isOwner => currentUserRole == 'OWNER';
  bool get hasBlocked => blockedMembers.isNotEmpty;

  factory GroupBlockedContext.fromJson(Map<String, dynamic> json) {
    final raw = json['blockedMembers'];
    return GroupBlockedContext(
      blockedMembers:
          raw is List
              ? raw
                  .map(
                    (e) => BlockedInGroup.fromJson(e as Map<String, dynamic>),
                  )
                  .toList()
              : const [],
      currentUserRole: json['currentUserRole'] as String?,
    );
  }
}

class BlockedInGroup {
  final int memberId;
  final String fullName;
  final String? avatarUrl;

  const BlockedInGroup({
    required this.memberId,
    required this.fullName,
    this.avatarUrl,
  });

  factory BlockedInGroup.fromJson(Map<String, dynamic> json) {
    return BlockedInGroup(
      memberId: (json['memberId'] as num).toInt(),
      fullName: json['fullName'] as String? ?? '',
      avatarUrl: json['avatarUrl'] as String?,
    );
  }
}
