import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../datasources/chat_api.dart';
import '../models/chat_conversation.dart';
import '../models/chat_group_member.dart';
import '../models/chat_message.dart';
import '../models/chat_recent_preview.dart';
import '../models/group_blocked_context.dart';

final chatRepositoryProvider = Provider<ChatRepository>((ref) {
  return ChatRepository(ref.watch(chatApiProvider));
});

class ChatRepository {
  ChatRepository(this._api);

  final ChatApi _api;

  /// Group + private chats merged into one list, sorted by last activity
  /// (newest first), mirroring the web sidebar. Conversations with no last
  /// message sort to the bottom.
  Future<List<ChatConversation>> listConversations({String? text}) async {
    final results = await Future.wait([
      _api.listGroups(text: text),
      _api.listPrivate(text: text),
    ]);
    final merged = [...results[0], ...results[1]];
    merged.sort((a, b) {
      final at = a.lastAt;
      final bt = b.lastAt;
      if (at == null && bt == null) return 0;
      if (at == null) return 1;
      if (bt == null) return -1;
      return bt.compareTo(at);
    });
    return merged;
  }

  Future<List<ChatMessage>> getMessages(
    int groupId, {
    int page = 0,
    int size = 20,
  }) =>
      _api.getMessages(groupId, page: page, size: size);

  Future<GroupBlockedContext> getBlockedContext(int groupId) =>
      _api.getBlockedContext(groupId);

  Future<ChatConversation> createGroup({
    String? title,
    required List<int> memberIds,
  }) =>
      _api.createGroup(title: title, memberIds: memberIds);

  Future<List<ChatGroupMember>> listMembers(int groupId) =>
      _api.listMembers(groupId);

  Future<void> addMembers(int groupId, List<int> memberIds) =>
      _api.addMembers(groupId, memberIds);

  Future<void> removeMember(int groupId, int memberId) =>
      _api.removeMember(groupId, memberId);

  Future<void> leaveGroup(int groupId) => _api.leaveGroup(groupId);

  Future<void> updateGroup(int groupId, String title) =>
      _api.updateGroup(groupId, title);

  Future<List<ChatRecentPreview>> recentPreviews() => _api.recentPreviews();
}
