/// The most-recent message in a conversation thread.
class LatestMessage {
  final int id;
  final String content;
  final int senderMemberId;

  const LatestMessage({
    required this.id,
    required this.content,
    required this.senderMemberId,
  });

  factory LatestMessage.fromJson(Map<String, dynamic> json) {
    return LatestMessage(
      id: (json['id'] as num).toInt(),
      content: json['content'] as String? ?? '',
      senderMemberId: (json['senderMemberId'] as num).toInt(),
    );
  }
}

/// Connection status between current user and a target member.
/// `status == null` means they have never interacted.
class ConnectionStatus {
  /// null | PENDING | ACCEPTED | REJECTED
  final String? status;
  final String? cooldownUntil;
  final LatestMessage? latestMessage;

  const ConnectionStatus({this.status, this.cooldownUntil, this.latestMessage});

  bool get isNull => status == null;
  bool get isPending => status == 'PENDING';
  bool get isAccepted => status == 'ACCEPTED';
  bool get isRejected => status == 'REJECTED';

  bool get cooldownExpired {
    if (cooldownUntil == null) return true;
    try {
      return DateTime.now().isAfter(DateTime.parse(cooldownUntil!));
    } catch (_) {
      return true;
    }
  }

  factory ConnectionStatus.fromJson(Map<String, dynamic> json) {
    return ConnectionStatus(
      status: json['status'] as String?,
      cooldownUntil: json['cooldownUntil'] as String?,
      latestMessage: json['latestMessage'] is Map
          ? LatestMessage.fromJson(
              json['latestMessage'] as Map<String, dynamic>)
          : null,
    );
  }
}
