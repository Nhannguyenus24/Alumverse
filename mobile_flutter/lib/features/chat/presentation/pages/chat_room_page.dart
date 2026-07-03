import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:go_router/go_router.dart';

import '../../../../core/router/route_names.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../shared/widgets/app_toast.dart';
import '../../../../shared/widgets/error_view.dart';
import '../../../../shared/widgets/loading_view.dart';
import '../../../auth/presentation/providers/auth_provider.dart';
import '../../../network/data/repositories/network_repository.dart';
import '../../realtime/chat_socket_service.dart';
import '../providers/chat_list_provider.dart';
import '../providers/chat_messages_provider.dart';
import '../providers/chat_socket_provider.dart';
import '../widgets/chat_blocked_banner.dart';
import '../widgets/chat_composer.dart';
import '../widgets/message_bubble.dart';

/// Arguments passed to [ChatRoomPage] via the router `extra`. Only [groupId] is
/// in the path; the rest let the room render immediately without an extra fetch.
class ChatRoomArgs {
  final int groupId;
  final String type; // GROUP | PRIVATE
  final String title;
  final int? peerMemberId;
  final bool blockedByMe;
  final bool blockedByPeer;

  const ChatRoomArgs({
    required this.groupId,
    this.type = 'PRIVATE',
    this.title = '',
    this.peerMemberId,
    this.blockedByMe = false,
    this.blockedByPeer = false,
  });
}

class ChatRoomPage extends ConsumerStatefulWidget {
  const ChatRoomPage({super.key, required this.args});

  final ChatRoomArgs args;

  @override
  ConsumerState<ChatRoomPage> createState() => _ChatRoomPageState();
}

class _ChatRoomPageState extends ConsumerState<ChatRoomPage> {
  final ScrollController _scrollController = ScrollController();
  late bool _blockedByMe;

  @override
  void initState() {
    super.initState();
    _blockedByMe = widget.args.blockedByMe;
    _scrollController.addListener(_onScroll);
  }

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  void _onScroll() {
    // reverse:true list — the top (older messages) is the max scroll extent.
    if (_scrollController.position.pixels >=
        _scrollController.position.maxScrollExtent - 200) {
      ref.read(chatMessagesProvider(widget.args.groupId).notifier).loadOlder();
    }
  }

  Future<void> _unblock() async {
    final peerId = widget.args.peerMemberId;
    if (peerId == null) return;
    try {
      await ref.read(networkRepositoryProvider).unblock(peerId);
      if (mounted) setState(() => _blockedByMe = false);
      ref.invalidate(chatListProvider);
      if (mounted) {
        AppToast.success(
          context,
          'chat.unblocked'.tr(namedArgs: {'name': widget.args.title}),
        );
      }
    } catch (e) {
      if (mounted) AppToast.fromError(context, e);
    }
  }

  @override
  Widget build(BuildContext context) {
    final args = widget.args;
    final messagesAsync = ref.watch(chatMessagesProvider(args.groupId));
    final socket = ref.watch(chatSocketServiceProvider);

    final currentMemberId =
        int.tryParse(ref.watch(authStateProvider).valueOrNull?.user?.id ?? '');

    // Messaging is blocked in a private chat if either side blocked the other.
    final privateBlocked =
        args.type == 'PRIVATE' && (_blockedByMe || args.blockedByPeer);

    return Scaffold(
      appBar: AppBar(
        title: Text(args.title.isNotEmpty ? args.title : 'chat.title'.tr()),
        actions: [
          if (args.type == 'GROUP')
            IconButton(
              icon: const Icon(Icons.group_outlined),
              tooltip: 'chat.members'.tr(),
              onPressed: () => context.push(
                '${RouteNames.chat}/${args.groupId}/members',
                extra: args.title,
              ),
            ),
        ],
      ),
      body: Column(
        children: [
          _buildBanner(args),
          Expanded(
            child: messagesAsync.when(
              loading: () => const LoadingView(),
              error: (e, _) => ErrorView(
                message: '$e',
                onRetry: () =>
                    ref.invalidate(chatMessagesProvider(args.groupId)),
              ),
              data: (messages) {
                if (messages.isEmpty) {
                  return Center(
                    child: Text(
                      'chat.no_messages'.tr(),
                      style: const TextStyle(color: AppColors.textSecondary),
                    ),
                  );
                }
                return ListView.builder(
                  controller: _scrollController,
                  reverse: true,
                  padding: const EdgeInsets.symmetric(vertical: 8),
                  itemCount: messages.length,
                  itemBuilder: (context, i) {
                    final msg = messages[i];
                    final isMine = currentMemberId != null &&
                        msg.senderMemberId == currentMemberId;
                    return MessageBubble(
                      message: msg,
                      isMine: isMine,
                      showSender: args.type == 'GROUP' && !isMine,
                    );
                  },
                );
              },
            ),
          ),
          // When private messaging is blocked the composer is hidden; the
          // banner above already explains why (and offers unblock if we blocked).
          if (!privateBlocked)
            ValueListenableBuilder<ChatSocketStatus>(
              valueListenable: socket.status,
              builder: (context, status, _) {
                return ChatComposer(
                  groupId: args.groupId,
                  chatType: args.type,
                  enabled: status == ChatSocketStatus.open,
                  onSend: (text) => ref
                      .read(chatMessagesProvider(args.groupId).notifier)
                      .send(text, chatType: args.type),
                );
              },
            ),
        ],
      ),
    );
  }

  Widget _buildBanner(ChatRoomArgs args) {
    if (args.type == 'PRIVATE') {
      if (_blockedByMe) {
        return ChatBlockedBanner.blockedByMe(
          peerName: args.title,
          onUnblock: _unblock,
        );
      }
      if (args.blockedByPeer) {
        return ChatBlockedBanner.blockedByPeer(peerName: args.title);
      }
      return const SizedBox.shrink();
    }

    // Group: fetch blocked-members context lazily.
    final blockedAsync = ref.watch(groupBlockedContextProvider(args.groupId));
    return blockedAsync.maybeWhen(
      data: (ctx) =>
          ctx.hasBlocked ? ChatBlockedBanner.group(ctx) : const SizedBox.shrink(),
      orElse: () => const SizedBox.shrink(),
    );
  }
}
