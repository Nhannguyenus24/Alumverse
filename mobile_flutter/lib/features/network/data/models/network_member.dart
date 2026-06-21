import 'dart:convert';

/// Coerce a `program`/`major` value into a display string. The backend may
/// return plain text, a real JSON array, or — as seen in practice — the whole
/// array serialised as a string (`'["Computer Science"]'`). Handle all three so
/// we never render raw brackets/quotes.
String? _coerce(dynamic v) {
  if (v == null) return null;
  if (v is List) return _joinList(v);
  if (v is String) {
    final s = v.trim();
    if (s.isEmpty) return null;
    // A JSON-array string like ["Computer Science","Master"].
    if (s.startsWith('[') && s.endsWith(']')) {
      try {
        final decoded = jsonDecode(s);
        if (decoded is List) return _joinList(decoded);
      } catch (_) {
        // fall through to the raw string
      }
    }
    return s;
  }
  return v.toString();
}

String? _joinList(List list) {
  final joined = list
      .map((e) => e.toString().trim())
      .where((e) => e.isNotEmpty)
      .join(' · ');
  return joined.isEmpty ? null : joined;
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
