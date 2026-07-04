import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../data/models/chat_conversation.dart';
import '../../data/models/chat_recent_preview.dart';
import '../../data/repositories/chat_repository.dart';

/// Free-text search applied to both group and private chat lists.
final chatListQueryProvider = StateProvider<String>((ref) => '');

/// The merged, sorted conversation list for the chat home screen.
///
/// `autoDispose` so reopening the chat list refetches instead of serving a
/// stale in-memory snapshot (the search text lives in [chatListQueryProvider],
/// which is preserved).
final chatListProvider = FutureProvider.autoDispose<List<ChatConversation>>((
  ref,
) async {
  final text = ref.watch(chatListQueryProvider);
  return ref
      .watch(chatRepositoryProvider)
      .listConversations(text: text.isEmpty ? null : text);
});

/// Group blocked-members banner context, fetched on demand per group.
///
/// `autoDispose` so the banner is refetched each time a room is opened.
final groupBlockedContextProvider = FutureProvider.autoDispose.family((
  ref,
  int groupId,
) {
  return ref.watch(chatRepositoryProvider).getBlockedContext(groupId);
});

/// Recent chat previews shown in the floating chat panel.
///
/// `autoDispose` so previews are refetched each time the panel is opened.
final recentPreviewsProvider =
    FutureProvider.autoDispose<List<ChatRecentPreview>>((ref) {
      return ref.watch(chatRepositoryProvider).recentPreviews();
    });
