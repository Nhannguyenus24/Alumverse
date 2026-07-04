import 'dart:convert';

/// A trusted verifier offered during organization registration. Mirrors the
/// web `getTrustedVerifiers` response: a member who can vouch for the applicant.
class TrustedVerifier {
  final int userId;
  final String? fullName;
  final String? studentId;
  final String? avatarUrl;
  final List<String> program;
  final List<String> major;

  const TrustedVerifier({
    required this.userId,
    this.fullName,
    this.studentId,
    this.avatarUrl,
    this.program = const [],
    this.major = const [],
  });

  String get displayName =>
      (fullName?.isNotEmpty ?? false) ? fullName! : (studentId ?? 'Anonymous');

  factory TrustedVerifier.fromJson(Map<String, dynamic> json) {
    return TrustedVerifier(
      userId: (json['userId'] as num).toInt(),
      fullName: json['fullName'] as String?,
      studentId: json['studentId'] as String?,
      avatarUrl: json['avatarUrl'] as String? ?? json['avatar'] as String?,
      program: _asStringList(json['program']),
      major: _asStringList(json['major']),
    );
  }

  /// The backend may send program/major as a JSON-encoded string or a list.
  static List<String> _asStringList(Object? value) {
    if (value is List) {
      return value
          .map((e) => e.toString().trim())
          .where((e) => e.isNotEmpty)
          .toList();
    }
    if (value is String && value.trim().isNotEmpty) {
      final trimmed = value.trim();
      try {
        final decoded = jsonDecode(trimmed);
        if (decoded is List) {
          return decoded
              .map((e) => e.toString().trim())
              .where((e) => e.isNotEmpty)
              .toList();
        }
      } catch (_) {}
      return [trimmed];
    }
    return const [];
  }
}
