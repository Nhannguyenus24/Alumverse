import 'dart:convert';

import 'package:cookie_jar/cookie_jar.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:path_provider/path_provider.dart';

import 'app.dart';
import 'core/network/dio_client.dart';

class _PreloadedAssetLoader extends AssetLoader {
  _PreloadedAssetLoader(this._cache);

  final Map<String, Map<String, dynamic>> _cache;

  static Future<_PreloadedAssetLoader> preload(
    String path,
    List<Locale> locales,
  ) async {
    final cache = <String, Map<String, dynamic>>{};
    for (final locale in locales) {
      final key = '$path/${locale.languageCode}.json';
      try {
        final raw = await rootBundle.loadString(key);
        cache[key] = json.decode(raw) as Map<String, dynamic>;
      } catch (_) {
        cache[key] = {};
      }
    }
    return _PreloadedAssetLoader(cache);
  }

  @override
  Future<Map<String, dynamic>> load(String path, Locale locale) async {
    final key = '$path/${locale.languageCode}.json';
    return _cache[key] ?? {};
  }
}

const _supportedLocales = [Locale('vi'), Locale('en')];

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await EasyLocalization.ensureInitialized();

  // Firebase (push). Guarded so a missing google-services config never blocks boot.
  try {
    await Firebase.initializeApp();
  } catch (e) {
    if (kDebugMode) debugPrint('Firebase init skipped: $e');
  }

  final (cookieJar, loader) =
      await (
        _createCookieJar(),
        _PreloadedAssetLoader.preload('assets/translations', _supportedLocales),
      ).wait;

  runApp(
    EasyLocalization(
      supportedLocales: _supportedLocales,
      path: 'assets/translations',
      fallbackLocale: const Locale('vi'),
      startLocale: const Locale('vi'),
      assetLoader: loader,
      child: AppRoot(cookieJar: cookieJar),
    ),
  );
}

class AppRoot extends StatefulWidget {
  const AppRoot({super.key, required this.cookieJar});
  final CookieJar cookieJar;

  @override
  State<AppRoot> createState() => AppRootState();

  static AppRootState of(BuildContext context) =>
      context.findAncestorStateOfType<AppRootState>()!;
}

class AppRootState extends State<AppRoot> {
  int _rebuildKey = 0;

  void rebuild() => setState(() => _rebuildKey++);

  @override
  Widget build(BuildContext context) {
    return ProviderScope(
      key: ValueKey(_rebuildKey),
      overrides: [cookieJarProvider.overrideWithValue(widget.cookieJar)],
      child: const App(),
    );
  }
}

Future<CookieJar> _createCookieJar() async {
  try {
    final dir = await getApplicationSupportDirectory();
    return PersistCookieJar(storage: FileStorage('${dir.path}/.cookies'));
  } catch (_) {
    return CookieJar();
  }
}
