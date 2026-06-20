/// An incoming connection request (`GET /api/chat/conversation-requests/search`).
class ConversationRequest {
  final int id;
  final String status; // PENDING | REJECTED
  final String? message;
  final String? messageCreatedAt;
  final int requesterMemberId;
  final String fullName;
  final String? avatarUrl;

  const ConversationRequest({
    required this.id,
    required this.status,
    this.message,
    this.messageCreatedAt,
    required this.requesterMemberId,
    required this.fullName,
    this.avatarUrl,
  });

  bool get isPending => status == 'PENDING';

  factory ConversationRequest.fromJson(Map<String, dynamic> json) {
    return ConversationRequest(
      id: (json['id'] as num).toInt(),
      status: json['status'] as String? ?? 'PENDING',
      message: json['message'] as String?,
      messageCreatedAt: json['messageCreatedAt'] as String?,
      requesterMemberId: (json['requesterMemberId'] as num).toInt(),
      fullName: json['fullName'] as String? ?? '',
      avatarUrl: json['avatarUrl'] as String?,
    );
  }
}
