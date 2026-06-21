/// A peer-verification request the current user RECEIVED — someone asked them
/// to vouch for their alumni/student identity.
/// (`GET /api/users/me/peer-verifications/pending`).
class PendingPeerVerification {
  final int requestId;
  final int requesterUserId;
  final String requesterName;
  final int organizationId;
  final DateTime? createdAt;

  const PendingPeerVerification({
    required this.requestId,
    required this.requesterUserId,
    this.requesterName = '',
    required this.organizationId,
    this.createdAt,
  });

  factory PendingPeerVerification.fromJson(Map<String, dynamic> json) {
    return PendingPeerVerification(
      requestId: (json['requestId'] as num?)?.toInt() ?? 0,
      requesterUserId: (json['requesterUserId'] as num?)?.toInt() ?? 0,
      requesterName: json['requesterName'] as String? ?? 'Người dùng',
      organizationId: (json['organizationId'] as num?)?.toInt() ?? 0,
      createdAt: json['createdAt'] is String
          ? DateTime.tryParse(json['createdAt'] as String)
          : null,
    );
  }
}
