String? _coerce(dynamic v) {
  if (v == null) return null;
  if (v is String) return v.isEmpty ? null : v;
  if (v is List) {
    final joined = v.map((e) => e.toString()).join(' · ');
    return joined.isEmpty ? null : joined;
  }
  return v.toString();
}

/// An accepted connection between two members (`GET /api/chat/connections/search`).
class Connection {
  final int? connectionId;
  final int? chatGroupId;
  final int peerMemberId;
  final String fullName;
  final String? avatarUrl;
  final String? program;
  final String? major;
  final String? connectedAt;

  const Connection({
    this.connectionId,
    this.chatGroupId,
    required this.peerMemberId,
    required this.fullName,
    this.avatarUrl,
    this.program,
    this.major,
    this.connectedAt,
  });

  String get subtitle {
    final parts = <String>[];
    if (major != null && major!.isNotEmpty) parts.add(major!);
    if (program != null && program!.isNotEmpty) parts.add(program!);
    return parts.join(' • ');
  }

  factory Connection.fromJson(Map<String, dynamic> json) {
    return Connection(
      connectionId: (json['connectionId'] as num?)?.toInt(),
      chatGroupId: (json['chatGroupId'] as num?)?.toInt(),
      peerMemberId: (json['peerMemberId'] as num).toInt(),
      fullName: json['fullName'] as String? ?? '',
      avatarUrl: json['avatarUrl'] as String?,
      program: _coerce(json['program']),
      major: _coerce(json['major']),
      connectedAt: json['connectedAt'] as String?,
    );
  }
}
