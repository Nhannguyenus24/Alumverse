import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../data/models/chat_conversation.dart';
import '../../data/models/chat_recent_preview.dart';
import '../../data/repositories/chat_repository.dart';

/// Free-text search applied to both group and private chat lists.
final chatListQueryProvider = StateProvider<String>((ref) => '');

/// The merged, sorted conversation list for the chat home screen.
final chatListProvider =
    FutureProvider<List<ChatConversation>>((ref) async {
  final text = ref.watch(chatListQueryProvider);
  return ref
      .watch(chatRepositoryProvider)
      .listConversations(text: text.isEmpty ? null : text);
});

/// Group blocked-members banner context, fetched on demand per group.
final groupBlockedContextProvider = FutureProvider.family((ref, int groupId) {
  return ref.watch(chatRepositoryProvider).getBlockedContext(groupId);
});

/// Recent chat previews shown in the floating chat panel.
final recentPreviewsProvider = FutureProvider<List<ChatRecentPreview>>((ref) {
  return ref.watch(chatRepositoryProvider).recentPreviews();
});
