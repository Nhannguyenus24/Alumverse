import 'dart:convert';

/// Coerce a `program`/`major` value into a display string. The backend may
/// return plain text, a real JSON array, or — as seen in practice — the whole
/// array serialised as a string (`'["Computer Science"]'`). Handle all three so
/// we never render raw brackets/quotes.
String? _coerce(dynamic v) {
  final list = _coerceList(v);
  if (list.isNotEmpty) return list.join(' · ');
  return null;
}

List<String> _coerceList(dynamic v) {
  if (v == null) return const [];
  if (v is List) {
    return v.expand<String>((e) => _coerceList(e)).toList(growable: false);
  }
  if (v is String) {
    var s = v.trim();
    if (s.isEmpty) return const [];
    for (var i = 0; i < 3; i++) {
      try {
        final decoded = jsonDecode(s);
        if (decoded is List) return _coerceList(decoded);
        if (decoded is String && decoded.trim() != s) {
          s = _unescapeQuotes(decoded.trim());
          continue;
        }
      } catch (_) {
        // Fall through to the bracket/comma fallback below.
      }
      break;
    }
    s = _stripOuterWrappers(_unescapeQuotes(s));
    for (var i = 0; i < 3; i++) {
      try {
        final decoded = jsonDecode(s);
        if (decoded is List) return _coerceList(decoded);
        if (decoded is String && decoded.trim() != s) {
          s = _stripOuterWrappers(_unescapeQuotes(decoded.trim()));
          continue;
        }
      } catch (_) {
        // Fall through to the bracket/comma fallback below.
      }
      break;
    }
    // A JSON-array string like ["Computer Science","Master"].
    if (s.startsWith('[') && s.endsWith(']')) {
      return _cleanList(s.substring(1, s.length - 1).split(','));
    }
    return _cleanList([s]);
  }
  return _cleanList([v]);
}

List<String> _cleanList(List list) {
  return list
      .map(_cleanToken)
      .where((e) => e.isNotEmpty)
      .toList(growable: false);
}

String _cleanToken(Object? value) {
  var s = _unescapeQuotes(value?.toString().trim() ?? '');
  s = s.replaceAll(RegExp(r'^\[+|\]+$'), '').trim();
  while (s.isNotEmpty && _isWrapper(s[0])) {
    s = s.substring(1).trim();
  }
  while (s.isNotEmpty && _isWrapper(s[s.length - 1])) {
    s = s.substring(0, s.length - 1).trim();
  }
  s = s.replaceAll(RegExp(r'^\[+|\]+$'), '').trim();
  return s;
}

String _unescapeQuotes(String s) {
  return s.replaceAll(r'\"', '"').replaceAll(r"\'", "'");
}

String _stripOuterWrappers(String s) {
  var out = s.trim();
  while (out.length >= 2 && _isWrapper(out[0]) && _isWrapper(out[out.length - 1])) {
    out = out.substring(1, out.length - 1).trim();
  }
  return out;
}

bool _isWrapper(String c) {
  return c == '"' || c == "'" || c == '“' || c == '”' || c == '‘' || c == '’';
}

List<String> _splitDisplay(String? value) {
  if (value == null || value.trim().isEmpty) return const [];
  return value
      .split('·')
      .map(_cleanToken)
      .where((e) => e.isNotEmpty)
      .toList(growable: false);
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
    return educationLines.join(' • ');
  }

  List<String> get educationLines {
    final programs = _splitDisplay(program);
    final majors = _splitDisplay(major);
    final maxLength =
        programs.length > majors.length ? programs.length : majors.length;

    return [
      for (var i = 0; i < maxLength; i++)
        [
          if (i < programs.length) programs[i],
          if (i < majors.length) majors[i],
        ].join(' · '),
    ].where((e) => e.isNotEmpty).toList(growable: false);
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
