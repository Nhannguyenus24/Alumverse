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

    // Only a token problem should trigger a refresh. A 401 can also be a
    // business rule (e.g. ACCOUNT_NOT_VERIFIED when browsing mentors) — those
    // must surface to the UI as-is, not loop through a pointless refresh.
    final shouldRefresh =
        response?.statusCode == 401 &&
        !alreadyRetried &&
        !_whitelist.contains(requestPath) &&
        _isTokenError(response?.data);

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

  /// True when a 401 looks like a token problem (expired/invalid/missing) and
  /// is worth a refresh. Business 401s (e.g. ACCOUNT_NOT_VERIFIED) return false
  /// so they surface to the UI without a pointless refresh+retry loop.
  /// When the error code is absent, fall back to refreshing (legacy behaviour).
  bool _isTokenError(dynamic body) {
    // ApplicationException bodies carry `errorCode`; the security filter's
    // token errors use `error`. Check both.
    final code =
        body is Map
            ? (body['errorCode'] ?? body['error'] ?? body['code'])
            : null;
    if (code is! String) return true; // unknown → keep old refresh behaviour
    const tokenCodes = {
      'TOKEN_EXPIRED',
      'INVALID_TOKEN',
      'UNAUTHORIZED',
      'REFRESH_TOKEN_NOT_FOUND',
      'INVALID_REFRESH_TOKEN',
    };
    return tokenCodes.contains(code);
  }

  /// Calls `/auth/refresh` (refresh token comes from the cookie jar), persists
  /// and returns the new access token, or null on failure.
  Future<String?> _refresh() async {
    final res = await refreshDio.post(ApiEndpoints.authRefresh);
    final body = res.data;
    final data =
        body is Map && body['data'] is Map ? body['data'] as Map : body;
    final token = (data is Map ? data['accessToken'] : null) as String?;
    if (token == null || token.isEmpty) return null;
    await _storage.writeAccessToken(token);
    final verificationLevel = data is Map ? data['verificationLevel'] : null;
    if (verificationLevel is num) {
      await _storage.writeVerificationLevel(verificationLevel.toInt());
    }
    return token;
  }
}
