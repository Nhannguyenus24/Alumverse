/// Coerce a `program`/`major` value into a display string. The backend now
/// returns the first array element as plain text (`om.program ->> 0`), but we
/// stay defensive: a raw JSON array (`List`) is joined with ` · `.
String? _coerce(dynamic v) {
  if (v == null) return null;
  if (v is String) return v.isEmpty ? null : v;
  if (v is List) {
    final joined = v.map((e) => e.toString()).join(' · ');
    return joined.isEmpty ? null : joined;
  }
  return v.toString();
}

/// A member in the organization directory, from `/api/chat/network/members`
/// (`NetworkMemberSearchItemResponse`).
class NetworkMember {
  final int userId;
  final String fullName;
  final String? program;
  final String? major;
  final String? avatarUrl;

  const NetworkMember({
    required this.userId,
    required this.fullName,
    this.program,
    this.major,
    this.avatarUrl,
  });

  /// Subtitle line showing both major and program when available, e.g.
  /// "Computer Science • Advanced Program".
  String get subtitle {
    final parts = <String>[];
    if (major != null && major!.isNotEmpty) parts.add(major!);
    if (program != null && program!.isNotEmpty) parts.add(program!);
    return parts.join(' • ');
  }

  factory NetworkMember.fromJson(Map<String, dynamic> json) {
    return NetworkMember(
      userId: (json['userId'] as num).toInt(),
      fullName: json['fullName'] as String? ?? '',
      program: _coerce(json['program']),
      major: _coerce(json['major']),
      avatarUrl: json['avatarUrl'] as String?,
    );
  }
}
