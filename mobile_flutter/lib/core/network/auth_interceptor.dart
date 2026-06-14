import 'package:dio/dio.dart';

import '../constants/api_endpoints.dart';
import '../storage/secure_storage.dart';

/// Attaches the bearer access token and, on a 401, transparently refreshes it
/// once using the refresh-token cookie, then retries the original request.
/// Mirrors the web client's axios interceptor (single retry, refresh dedup).
class AuthInterceptor extends Interceptor {
  AuthInterceptor(this._storage, {required this.refreshDio});

  final SecureStorage _storage;

  /// Cookie-only client used to call `/auth/refresh` without re-entering this
  /// interceptor (avoids a refresh→401→refresh loop).
  final Dio refreshDio;

  /// Paths that must never trigger a refresh attempt.
  static const _whitelist = {
    ApiEndpoints.authLogin,
    ApiEndpoints.authGoogleLogin,
    ApiEndpoints.authRefresh,
  };

  /// Shared in-flight refresh so concurrent 401s wait on a single call.
  Future<String?>? _refreshing;

  @override
  Future<void> onRequest(
    RequestOptions options,
    RequestInterceptorHandler handler,
  ) async {
    final token = await _storage.readAccessToken();
    if (token != null && token.isNotEmpty) {
      options.headers['Authorization'] = 'Bearer $token';
    }
    handler.next(options);
  }

  @override
  Future<void> onError(
    DioException err,
    ErrorInterceptorHandler handler,
  ) async {
    final response = err.response;
    final requestPath = err.requestOptions.path;
    final alreadyRetried = err.requestOptions.extra['__retried'] == true;

    final shouldRefresh = response?.statusCode == 401 &&
        !alreadyRetried &&
        !_whitelist.contains(requestPath);

    if (!shouldRefresh) {
      handler.next(err);
      return;
    }

    try {
      final newToken = await (_refreshing ??= _refresh());
      _refreshing = null;

      if (newToken == null || newToken.isEmpty) {
        await _storage.clearAuth();
        handler.next(err);
        return;
      }

      // Retry the original request once with the fresh token.
      final options = err.requestOptions;
      options.headers['Authorization'] = 'Bearer $newToken';
      options.extra['__retried'] = true;

      final retryResponse = await refreshDio.fetch(options);
      handler.resolve(retryResponse);
    } catch (_) {
      _refreshing = null;
      await _storage.clearAuth();
      handler.next(err);
    }
  }

  /// Calls `/auth/refresh` (refresh token comes from the cookie jar), persists
  /// and returns the new access token, or null on failure.
  Future<String?> _refresh() async {
    final res = await refreshDio.post(ApiEndpoints.authRefresh);
    final body = res.data;
    final data = body is Map && body['data'] is Map ? body['data'] as Map : body;
    final token = (data is Map ? data['accessToken'] : null) as String?;
    if (token == null || token.isEmpty) return null;
    await _storage.writeAccessToken(token);
    return token;
  }
}
