import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/router/route_names.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../shared/widgets/empty_view.dart';
import '../../../../shared/widgets/error_view.dart';
import '../../../../shared/widgets/loading_view.dart';
import '../../data/models/chat_conversation.dart';
import '../providers/chat_list_provider.dart';
import '../widgets/conversation_tile.dart';
import 'chat_room_page.dart';

/// Chat home: the merged list of group + private conversations, with search.
class ChatListPage extends ConsumerStatefulWidget {
  const ChatListPage({super.key});

  @override
  ConsumerState<ChatListPage> createState() => _ChatListPageState();
}

class _ChatListPageState extends ConsumerState<ChatListPage> {
  final TextEditingController _searchController = TextEditingController();

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  void _openConversation(ChatConversation c) {
    context.push(
      '${RouteNames.chat}/${c.id}',
      extra: ChatRoomArgs(
        groupId: c.id,
        type: c.type,
        title: c.name,
        peerMemberId: c.peerMemberId,
        blockedByMe: c.blockedByMe,
        blockedByPeer: c.blockedByPeer,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('chat.title'.tr()),
        actions: [
          IconButton(
            icon: const Icon(Icons.add_comment_outlined),
            tooltip: 'chat.create_group'.tr(),
            onPressed: () => context.push('${RouteNames.chat}/new'),
          ),
        ],
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
            child: TextField(
              controller: _searchController,
              textInputAction: TextInputAction.search,
              onSubmitted:
                  (v) =>
                      ref.read(chatListQueryProvider.notifier).state = v.trim(),
              decoration: InputDecoration(
                hintText: 'chat.search_hint'.tr(),
                prefixIcon: const Icon(Icons.search),
                isDense: true,
                filled: true,
                fillColor: AppColors.background,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(24),
                  borderSide: BorderSide.none,
                ),
              ),
            ),
          ),
          Expanded(
            child: Consumer(
              builder: (context, ref, _) {
                final async = ref.watch(chatListProvider);
                return async.when(
                  loading: () => const LoadingView(),
                  error:
                      (e, _) => ErrorView(
                        message: '$e',
                        onRetry: () => ref.invalidate(chatListProvider),
                      ),
                  data: (items) {
                    if (items.isEmpty) {
                      return EmptyView(
                        icon: Icons.forum_outlined,
                        title: 'chat.no_conversations'.tr(),
                        message: 'chat.empty_desc'.tr(),
                      );
                    }
                    return RefreshIndicator(
                      onRefresh: () async => ref.invalidate(chatListProvider),
                      child: ListView.separated(
                        padding: const EdgeInsets.only(bottom: 16),
                        itemCount: items.length,
                        separatorBuilder:
                            (_, __) => const Divider(
                              height: 1,
                              indent: 72,
                              color: AppColors.divider,
                            ),
                        itemBuilder:
                            (context, i) => ConversationTile(
                              conversation: items[i],
                              onTap: () => _openConversation(items[i]),
                            ),
                      ),
                    );
                  },
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
