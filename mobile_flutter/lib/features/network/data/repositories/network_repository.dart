import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/constants/api_endpoints.dart';
import '../../../../core/network/dio_client.dart';
import '../models/blocked_member.dart';
import '../models/connection.dart';
import '../models/connection_status.dart';
import '../models/conversation_request.dart';
import '../models/network_member.dart';

final networkRepositoryProvider = Provider<NetworkRepository>((ref) {
  return NetworkRepository(ref.watch(dioProvider));
});

/// A page of items from a chat/network paginated endpoint.
/// Note: these endpoints use `totalPage`/`totalItem` (singular), unlike
/// the shared PaginatedResponse which uses `totalPages`/`totalElements`.
class NetworkPageResult<T> {
  final List<T> items;
  final int totalPage;
  final int totalItem;

  const NetworkPageResult({
    required this.items,
    required this.totalPage,
    required this.totalItem,
  });
}

class NetworkRepository {
  NetworkRepository(this._dio);

  final Dio _dio;

  // ── Directory ────────────────────────────────────────────────────────────

  /// Used by the home "Cộng đồng" section (size=6, no pagination needed).
  Future<List<NetworkMember>> searchMembers({
    String? fullName,
    String? program,
    String? major,
    int page = 0,
    int size = 9,
  }) async {
    final res = await _dio.get(
      ApiEndpoints.networkMembers,
      queryParameters: {
        if (fullName != null && fullName.isNotEmpty) 'fullName': fullName,
        if (program != null && program.isNotEmpty) 'program': program,
        if (major != null && major.isNotEmpty) 'major': major,
        'page': page,
        'size': size,
      },
    );
    return _items(res.data, NetworkMember.fromJson);
  }

  /// Full directory search with pagination metadata for the Network tab.
  Future<NetworkPageResult<NetworkMember>> searchMembersPaged({
    String? fullName,
    String? program,
    String? major,
    List<int>? organizationIds,
    int page = 0,
    int size = 10,
  }) async {
    final res = await _dio.get(
      ApiEndpoints.networkMembers,
      queryParameters: {
        if (fullName != null && fullName.isNotEmpty) 'fullName': fullName,
        if (program != null && program.isNotEmpty) 'program': program,
        if (major != null && major.isNotEmpty) 'major': major,
        // Dio's default ListFormat.multiCompatible serializes this as
        // organizationIds=1&organizationIds=2, which the backend binds to
        // List<Integer> organizationIds. Omit when empty → all organizations.
        if (organizationIds != null && organizationIds.isNotEmpty)
          'organizationIds': organizationIds,
        'page': page,
        'size': size,
      },
    );
    return _pageResult(res.data, NetworkMember.fromJson);
  }

  // ── Incoming requests ────────────────────────────────────────────────────

  Future<NetworkPageResult<ConversationRequest>> searchIncomingRequests({
    String? fullName,
    String? status,
    int page = 0,
    int size = 10,
  }) async {
    final res = await _dio.get(
      ApiEndpoints.chatConversationRequestSearch,
      queryParameters: {
        if (fullName != null && fullName.isNotEmpty) 'fullName': fullName,
        if (status != null && status.isNotEmpty) 'status': status,
        'page': page,
        'size': size,
      },
    );
    return _pageResult(res.data, ConversationRequest.fromJson);
  }

  Future<void> respondRequest({required int id, required String status}) async {
    await _dio.put(
      ApiEndpoints.chatConversationRequestRespond,
      data: {'id': id, 'status': status},
    );
  }

  // ── Connections ──────────────────────────────────────────────────────────

  Future<NetworkPageResult<Connection>> searchConnections({
    String? fullName,
    int page = 0,
    int size = 10,
  }) async {
    final res = await _dio.get(
      ApiEndpoints.connectionsSearch,
      queryParameters: {
        if (fullName != null && fullName.isNotEmpty) 'fullName': fullName,
        'page': page,
        'size': size,
      },
    );
    return _pageResult(res.data, Connection.fromJson);
  }

  // ── Blocked members ──────────────────────────────────────────────────────

  Future<NetworkPageResult<BlockedMember>> searchBlockedMembers({
    String? fullName,
    int page = 0,
    int size = 10,
  }) async {
    final res = await _dio.get(
      ApiEndpoints.blocks,
      queryParameters: {
        if (fullName != null && fullName.isNotEmpty) 'fullName': fullName,
        'page': page,
        'size': size,
      },
    );
    return _pageResult(res.data, BlockedMember.fromJson);
  }

  // ── Message / connection status ──────────────────────────────────────────

  Future<ConnectionStatus?> getConnectionStatus(int targetMemberId) async {
    final res = await _dio.get(
      ApiEndpoints.chatConnectionStatus,
      queryParameters: {'targetMemberId': targetMemberId},
    );
    final data = res.data is Map ? res.data['data'] : res.data;
    if (data == null) return null;
    return ConnectionStatus.fromJson(data as Map<String, dynamic>);
  }

  Future<void> sendConnectionRequest({
    required int targetMemberId,
    required String message,
  }) async {
    await _dio.post(
      ApiEndpoints.chatConversationRequests,
      data: {'targetMemberId': targetMemberId, 'message': message},
    );
  }

  // ── Block / Unblock ──────────────────────────────────────────────────────

  Future<void> block(int memberId) async {
    await _dio.post(ApiEndpoints.blockUser(memberId));
  }

  Future<void> unblock(int memberId) async {
    await _dio.delete(ApiEndpoints.blockUser(memberId));
  }

  // ── helpers ──────────────────────────────────────────────────────────────

  List<T> _items<T>(dynamic body, T Function(Map<String, dynamic>) fromJson) {
    final data = body is Map ? body['data'] : body;
    final items = data is Map ? data['items'] : data;
    if (items is! List) return const [];
    return items.map((e) => fromJson(e as Map<String, dynamic>)).toList();
  }

  NetworkPageResult<T> _pageResult<T>(
    dynamic body,
    T Function(Map<String, dynamic>) fromJson,
  ) {
    final data = body is Map ? body['data'] : body;
    final map = data is Map<String, dynamic> ? data : <String, dynamic>{};
    final raw = map['items'];
    final items =
        raw is List
            ? raw.map((e) => fromJson(e as Map<String, dynamic>)).toList()
            : <T>[];
    return NetworkPageResult<T>(
      items: items,
      totalPage: (map['totalPage'] as num?)?.toInt() ?? 1,
      totalItem: (map['totalItem'] as num?)?.toInt() ?? items.length,
    );
  }
}
