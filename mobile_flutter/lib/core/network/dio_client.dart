import 'package:cookie_jar/cookie_jar.dart';
import 'package:dio/dio.dart';
import 'package:dio_cookie_manager/dio_cookie_manager.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:pretty_dio_logger/pretty_dio_logger.dart';

import '../config/env.dart';
import '../storage/secure_storage.dart';
import 'auth_interceptor.dart';
import 'error_interceptor.dart';

/// Persistent cookie store shared by the app. The backend sets the refresh
/// token as an HTTP-only cookie on login/refresh; the cookie manager replays
/// it on `/auth/refresh` automatically — we never read it ourselves.
///
/// This MUST be overridden in `main()` with a [PersistCookieJar] so the refresh
/// cookie survives app restarts (the mobile equivalent of browser cookie
/// persistence). Without persistence, a cold start leaves the jar empty and the
/// first token refresh fails — logging the user out the moment the short-lived
/// access token expires.
final cookieJarProvider = Provider<CookieJar>((ref) {
  throw UnimplementedError(
    'cookieJarProvider must be overridden in main() with a persistent jar',
  );
});

final dioProvider = Provider<Dio>((ref) {
  final storage = ref.watch(secureStorageProvider);
  final cookieJar = ref.watch(cookieJarProvider);
  final refreshDio = ref.watch(refreshDioProvider);

  final dio = Dio(
    BaseOptions(
      baseUrl: Env.apiBaseUrl,
      connectTimeout: const Duration(seconds: 10),
      receiveTimeout: const Duration(seconds: 15),
      sendTimeout: const Duration(seconds: 10),
      contentType: 'application/json',
      responseType: ResponseType.json,
    ),
  );

  dio.interceptors.addAll([
    CookieManager(cookieJar),
    AuthInterceptor(storage, refreshDio: refreshDio),
    ErrorInterceptor(),
    if (kDebugMode)
      PrettyDioLogger(
        requestHeader: false,
        requestBody: true,
        responseBody: true,
        compact: true,
        maxWidth: 100,
      ),
  ]);

  return dio;
});

/// Dedicated client for `/auth/refresh` — only the cookie manager, no auth or
/// error interceptors, to avoid a refresh→401→refresh loop. Mirrors the web
/// client's separate `refreshClient`.
final refreshDioProvider = Provider<Dio>((ref) {
  final cookieJar = ref.watch(cookieJarProvider);
  final dio = Dio(
    BaseOptions(
      baseUrl: Env.apiBaseUrl,
      connectTimeout: const Duration(seconds: 10),
      receiveTimeout: const Duration(seconds: 15),
      contentType: 'application/json',
      responseType: ResponseType.json,
    ),
  );
  dio.interceptors.add(CookieManager(cookieJar));
  return dio;
});
