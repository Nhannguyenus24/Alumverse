import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../data/models/chat_group_member.dart';
import '../../data/models/chat_recent_preview.dart';
import '../../data/repositories/chat_repository.dart';

/// Members of a group chat. Supports add/remove mutations that reload the list.
final chatGroupMembersProvider = AsyncNotifierProvider.family<
  ChatGroupMembersNotifier,
  List<ChatGroupMember>,
  int
>(ChatGroupMembersNotifier.new);

class ChatGroupMembersNotifier
    extends FamilyAsyncNotifier<List<ChatGroupMember>, int> {
  int get _groupId => arg;

  @override
  Future<List<ChatGroupMember>> build(int groupId) {
    return ref.read(chatRepositoryProvider).listMembers(groupId);
  }

  Future<void> addMembers(List<int> memberIds) async {
    await ref.read(chatRepositoryProvider).addMembers(_groupId, memberIds);
    ref.invalidateSelf();
  }

  Future<void> removeMember(int memberId) async {
    await ref.read(chatRepositoryProvider).removeMember(_groupId, memberId);
    ref.invalidateSelf();
  }
}

/// Recent chat previews (shown on Home or as a notification badge).
final chatRecentPreviewsProvider =
    FutureProvider.autoDispose<List<ChatRecentPreview>>((ref) {
      return ref.read(chatRepositoryProvider).recentPreviews();
    });
