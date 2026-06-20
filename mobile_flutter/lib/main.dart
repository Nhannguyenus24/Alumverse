import 'package:cookie_jar/cookie_jar.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:path_provider/path_provider.dart';

import 'app.dart';
import 'core/network/dio_client.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  final cookieJar = await _createCookieJar();

  runApp(
    ProviderScope(
      overrides: [cookieJarProvider.overrideWithValue(cookieJar)],
      child: const App(),
    ),
  );
}

/// Builds a persistent cookie jar so the HTTP-only refresh-token cookie survives
/// app restarts. Falls back to an in-memory jar if the file storage can't be
/// initialized (the app still runs; refresh just won't persist across restarts).
Future<CookieJar> _createCookieJar() async {
  try {
    final dir = await getApplicationSupportDirectory();
    return PersistCookieJar(storage: FileStorage('${dir.path}/.cookies'));
  } catch (_) {
    return CookieJar();
  }
}
