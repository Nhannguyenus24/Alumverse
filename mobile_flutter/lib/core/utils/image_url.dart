import '../config/env.dart';

/// Resolves an image reference from the API to a fully-qualified URL.
/// The backend stores either an absolute URL or a relative path served by
/// Nginx under `/images/` (see project image pipeline).
String? resolveImageUrl(String? raw) {
  if (raw == null || raw.isEmpty) return null;
  if (raw.startsWith('http://') || raw.startsWith('https://')) return raw;
  final base = Env.imageBaseUrl.endsWith('/')
      ? Env.imageBaseUrl
      : '${Env.imageBaseUrl}/';
  final path = raw.startsWith('/') ? raw.substring(1) : raw;
  return '$base$path';
}
