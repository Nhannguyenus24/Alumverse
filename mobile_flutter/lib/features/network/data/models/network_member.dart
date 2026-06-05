/// A member in the organization directory, from `/api/chat/network/members`
/// (`NetworkMemberSearchItemResponse`).
class NetworkMember {
  final int userId;
  final String fullName;
  final String? program;
  final String? major;
  final int? startYear;
  final String? avatarUrl;

  const NetworkMember({
    required this.userId,
    required this.fullName,
    this.program,
    this.major,
    this.startYear,
    this.avatarUrl,
  });

  /// Short subtitle line: "Major • K{startYear}" / program fallback.
    this.avatarUrl,
  });

  /// Short subtitle line: major, or program fallback.
  String get subtitle {
    final parts = <String>[];
    if (major != null && major!.isNotEmpty) {
      parts.add(major!);
    } else if (program != null && program!.isNotEmpty) {
      parts.add(program!);
    }
    if (startYear != null) parts.add('K$startYear');
    return parts.join(' • ');
  }

  factory NetworkMember.fromJson(Map<String, dynamic> json) {
    return NetworkMember(
      userId: (json['userId'] as num).toInt(),
      fullName: json['fullName'] as String? ?? '',
      program: json['program'] as String?,
      major: json['major'] as String?,
      startYear: (json['startYear'] as num?)?.toInt(),
      avatarUrl: json['avatarUrl'] as String?,
    );
  }
}
