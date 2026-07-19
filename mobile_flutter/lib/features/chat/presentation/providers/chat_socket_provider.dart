import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/constants/api_endpoints.dart';
import '../../../../core/network/dio_client.dart';
import '../../../../core/storage/secure_storage.dart';
import '../../../../core/utils/jwt_helper.dart';
import '../../realtime/chat_socket_service.dart';

/// App-wide single chat WebSocket connection. Disposed with the provider scope
/// (e.g. on logout when the container is torn down).
///
/// The WS authenticates via a `?token=` query param validated only at the
/// handshake, so it must hand the socket a *valid* access token. The resolver
/// below refreshes an expired token through the refresh-cookie (same flow as
/// the REST [AuthInterceptor]) before each connect/reconnect.
final chatSocketServiceProvider = Provider<ChatSocketService>((ref) {
  final storage = ref.watch(secureStorageProvider);
  final refreshDio = ref.watch(refreshDioProvider);

  Future<String?> getValidToken() async {
    final token = await storage.readAccessToken();
    if (token != null && token.isNotEmpty && !JwtHelper.isExpired(token)) {
      return token;
    }
    // Expired or missing → refresh via the HTTP-only refresh cookie.
    try {
      final organizationId =
          await storage.readOrganizationId() ??
          JwtHelper.organizationIdFromToken(token);
      final res = await refreshDio.post(
        ApiEndpoints.authRefresh,
        queryParameters:
            organizationId == null ? null : {'organizationId': organizationId},
      );
      final body = res.data;
      final data =
          body is Map && body['data'] is Map ? body['data'] as Map : body;
      final newToken = (data is Map ? data['accessToken'] : null) as String?;
      if (newToken != null && newToken.isNotEmpty) {
        await storage.writeAccessToken(newToken);
        final refreshedOrganizationId = JwtHelper.organizationIdFromToken(
          newToken,
        );
        if (refreshedOrganizationId != null) {
          await storage.writeOrganizationId(refreshedOrganizationId);
        }
        return newToken;
      }
    } catch (_) {
      // Fall through — return the stale token; the handshake will fail and
      // trigger a backoff reconnect, by which point a REST call may have
      // refreshed the token.
    }
    return token;
  }

  final service = ChatSocketService(getValidToken);
  ref.onDispose(service.dispose);
  return service;
});
