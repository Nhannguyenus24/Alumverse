import '../config/env.dart';

/// Resolves an image reference from the API to a fully-qualified URL.
/// The backend stores either an absolute URL or a relative path served by
/// Nginx under `/images/` (see project image pipeline).
String? resolveImageUrl(String? raw) {
  if (raw == null || raw.isEmpty) return null;

  if (raw.startsWith('http://') || raw.startsWith('https://')) {
    // The backend often returns an absolute URL pointing at `localhost`
    // (`image.domain=http://localhost/images/...`). On a device/emulator,
    // `localhost` is the device itself, so rewrite that host to the
    // configured image host (e.g. 10.0.2.2) while keeping the path.
    final uri = Uri.tryParse(raw);
    if (uri != null && (uri.host == 'localhost' || uri.host == '127.0.0.1')) {
      final base = Uri.tryParse(Env.imageBaseUrl);
      if (base != null) {
        return uri
            .replace(
              scheme: base.scheme,
              host: base.host,
              port: base.hasPort ? base.port : null,
            )
            .toString();
      }
    }
    return raw;
  }

  final base =
      Env.imageBaseUrl.endsWith('/')
          ? Env.imageBaseUrl
          : '${Env.imageBaseUrl}/';
  final path = raw.startsWith('/') ? raw.substring(1) : raw;
  return '$base$path';
}
