import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/constants/api_endpoints.dart';
import '../../../../core/network/dio_client.dart';
import '../models/chat_conversation.dart';
import '../models/chat_group_member.dart';
import '../models/chat_message.dart';
import '../models/chat_recent_preview.dart';
import '../models/group_blocked_context.dart';

final chatApiProvider = Provider<ChatApi>((ref) {
  return ChatApi(ref.watch(dioProvider));
});

/// Transport over the REST `/api/chat/*` endpoints used by the chat list and
/// chat room. Real-time send/receive goes through the WebSocket service, not
/// here. Paginated chat endpoints wrap results in
/// `{ data: { items, totalPage, totalItem } }` (singular `totalPage`).
class ChatApi {
  ChatApi(this._dio);

  final Dio _dio;

  /// Group chats the current user belongs to.
  Future<List<ChatConversation>> listGroups({
    String? text,
    int page = 0,
    int size = 50,
  }) async {
    final res = await _dio.get(
      ApiEndpoints.chatGroups,
      queryParameters: {
        if (text != null && text.isNotEmpty) 'text': text,
        'page': page,
        'size': size,
      },
    );
    return _items(res.data, ChatConversation.fromGroupJson);
  }

  /// 1-1 (private) chats.
  Future<List<ChatConversation>> listPrivate({
    String? text,
    int page = 0,
    int size = 50,
  }) async {
    final res = await _dio.get(
      ApiEndpoints.chatPrivateList,
      queryParameters: {
        if (text != null && text.isNotEmpty) 'text': text,
        'page': page,
        'size': size,
      },
    );
    return _items(res.data, ChatConversation.fromPrivateJson);
  }

  /// Message history for a conversation. Backend returns newest-first (DESC);
  /// we keep that order (the room renders a `reverse: true` list).
  Future<List<ChatMessage>> getMessages(
    int groupId, {
    int page = 0,
    int size = 20,
  }) async {
    final res = await _dio.get(
      ApiEndpoints.chatGroupMessages('$groupId'),
      queryParameters: {'page': page, 'size': size},
    );
    final data = res.data is Map ? res.data['data'] : res.data;
    if (data is! List) return const [];
    return data
        .map((e) => ChatMessage.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  /// Blocked-members banner context for a group chat.
  Future<GroupBlockedContext> getBlockedContext(int groupId) async {
    final res = await _dio.get(ApiEndpoints.chatGroupBlockedContext(groupId));
    final data = res.data is Map ? res.data['data'] : res.data;
    if (data is! Map) return const GroupBlockedContext();
    return GroupBlockedContext.fromJson(data as Map<String, dynamic>);
  }

  /// Creates a new group chat (max 10 members including creator).
  Future<ChatConversation> createGroup({
    String? title,
    required List<int> memberIds,
  }) async {
    final res = await _dio.post(
      ApiEndpoints.chatGroups,
      data: {
        if (title != null && title.isNotEmpty) 'title': title,
        'memberIds': memberIds,
      },
    );
    final data = res.data is Map ? res.data['data'] : res.data;
    return ChatConversation.fromGroupJson(data as Map<String, dynamic>);
  }

  /// Members of a group chat.
  Future<List<ChatGroupMember>> listMembers(
    int groupId, {
    String? text,
    int page = 0,
    int size = 50,
  }) async {
    final res = await _dio.get(
      ApiEndpoints.chatGroupMembers(groupId),
      queryParameters: {
        if (text != null && text.isNotEmpty) 'text': text,
        'page': page,
        'size': size,
      },
    );
    return _items(res.data, ChatGroupMember.fromJson);
  }

  /// Adds members to a group (owner only).
  Future<void> addMembers(int groupId, List<int> memberIds) async {
    await _dio.post(
      ApiEndpoints.chatGroupMembers(groupId),
      data: {'memberIds': memberIds},
    );
  }

  /// Removes a member from a group (owner only).
  Future<void> removeMember(int groupId, int memberId) async {
    await _dio.delete(ApiEndpoints.chatGroupMember(groupId, memberId));
  }

  /// Leaves a group (any member).
  Future<void> leaveGroup(int groupId) async {
    await _dio.delete(ApiEndpoints.chatGroupLeave(groupId));
  }

  /// Updates a group's title (owner only). Backend returns the updated group;
  /// the caller already knows the new title, so the response is ignored.
  Future<void> updateGroup(int groupId, String title) async {
    await _dio.put(
      ApiEndpoints.chatGroupUpdate(groupId),
      data: {'title': title},
    );
  }

  /// Recent chat previews for the current user.
  Future<List<ChatRecentPreview>> recentPreviews() async {
    final res = await _dio.get(ApiEndpoints.chatRecentPreviews);
    final data = res.data is Map ? res.data['data'] : res.data;
    if (data is! List) return const [];
    return data
        .map((e) => ChatRecentPreview.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  List<T> _items<T>(dynamic body, T Function(Map<String, dynamic>) fromJson) {
    final data = body is Map ? body['data'] : body;
    final items = data is Map ? data['items'] : data;
    if (items is! List) return const [];
    return items.map((e) => fromJson(e as Map<String, dynamic>)).toList();
  }
}
