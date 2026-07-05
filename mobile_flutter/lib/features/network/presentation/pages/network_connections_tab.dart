import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../../core/router/route_names.dart';
import '../../../../../core/theme/app_colors.dart';
import '../../../../../shared/widgets/app_toast.dart';
import '../../../../../shared/widgets/empty_view.dart';
import '../../../chat/presentation/pages/chat_room_page.dart';
import '../../data/models/connection.dart';
import '../../data/repositories/network_repository.dart';
import '../providers/network_provider.dart';
import '../widgets/connection_card.dart';
import '../widgets/network_search_bar.dart';

class NetworkConnectionsTab extends ConsumerWidget {
  const NetworkConnectionsTab({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final query = ref.watch(networkConnectionsQueryProvider);
    final async = ref.watch(networkConnectionsProvider);

    return Column(
      children: [
        NetworkSearchBar(
          hintText: 'network.search_connections_hint'.tr(),
          initialValue: query.fullName,
          onSubmit:
              (v) =>
                  ref.read(networkConnectionsQueryProvider.notifier).state =
                      query.copyWith(fullName: v).resetPage(),
        ),
        Expanded(
          child: async.when(
            loading: () => const Center(child: CircularProgressIndicator()),
            error:
                (e, _) => Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(
                        Icons.error_outline,
                        color: AppColors.error,
                        size: 40,
                      ),
                      const SizedBox(height: 8),
                      Text(
                        '$e',
                        style: const TextStyle(color: AppColors.textSecondary),
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 12),
                      ElevatedButton(
                        onPressed:
                            () => ref.invalidate(networkConnectionsProvider),
                        child: Text('common.retry'.tr()),
                      ),
                    ],
                  ),
                ),
            data: (result) {
              if (result.items.isEmpty) {
                return EmptyView(
                  icon: Icons.group_outlined,
                  title: 'network.no_connections'.tr(),
                  message: 'network.no_connections_desc'.tr(),
                );
              }
              return RefreshIndicator(
                onRefresh:
                    () async => ref.invalidate(networkConnectionsProvider),
                child: ListView.builder(
                  padding: const EdgeInsets.only(bottom: 16),
                  itemCount: result.items.length + 1,
                  itemBuilder: (ctx, i) {
                    if (i == result.items.length) {
                      return _PaginationBar(
                        page: query.page,
                        totalPage: result.totalPage,
                        onPrev:
                            () =>
                                ref
                                    .read(
                                      networkConnectionsQueryProvider.notifier,
                                    )
                                    .state = query.copyWith(
                                  page: query.page - 1,
                                ),
                        onNext:
                            () =>
                                ref
                                    .read(
                                      networkConnectionsQueryProvider.notifier,
                                    )
                                    .state = query.copyWith(
                                  page: query.page + 1,
                                ),
                      );
                    }
                    final conn = result.items[i];
                    return ConnectionCard(
                      connection: conn,
                      onChat: () => _openChat(context, conn),
                      onViewProfile:
                          () => context.push(
                            '${RouteNames.profile}/${conn.peerMemberId}',
                          ),
                      onBlock:
                          () => _confirmBlock(
                            context,
                            ref,
                            conn.peerMemberId,
                            conn.fullName,
                          ),
                    );
                  },
                ),
              );
            },
          ),
        ),
      ],
    );
  }

  /// Open the chat with a connection. Prefer the existing private chat group
  /// (deep-links straight into the room); fall back to the chat list when the
  /// connection has no chat group id yet.
  void _openChat(BuildContext context, Connection conn) {
    final groupId = conn.chatGroupId;
    if (groupId == null) {
      context.go(RouteNames.chat);
      return;
    }
    context.push(
      '${RouteNames.chat}/$groupId',
      extra: ChatRoomArgs(
        groupId: groupId,
        type: 'PRIVATE',
        title: conn.fullName,
        peerMemberId: conn.peerMemberId,
      ),
    );
  }

  Future<void> _confirmBlock(
    BuildContext context,
    WidgetRef ref,
    int memberId,
    String name,
  ) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder:
          (ctx) => AlertDialog(
            title: Text('network.block_member_title'.tr()),
            content: Text(
              'network.confirm_block_connection'.tr(namedArgs: {'name': name}),
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(ctx, false),
                child: Text('common.cancel'.tr()),
              ),
              TextButton(
                onPressed: () => Navigator.pop(ctx, true),
                child: Text(
                  'network.block'.tr(),
                  style: const TextStyle(color: AppColors.error),
                ),
              ),
            ],
          ),
    );
    if (confirm != true) return;
    try {
      await ref.read(networkRepositoryProvider).block(memberId);
      ref.invalidate(networkConnectionsProvider);
      ref.invalidate(networkBlockedProvider);
      if (context.mounted) {
        AppToast.success(
          context,
          'network.blocked_toast'.tr(namedArgs: {'name': name}),
        );
      }
    } catch (e) {
      if (context.mounted) AppToast.fromError(context, e);
    }
  }
}

class _PaginationBar extends StatelessWidget {
  const _PaginationBar({
    required this.page,
    required this.totalPage,
    required this.onPrev,
    required this.onNext,
  });

  final int page;
  final int totalPage;
  final VoidCallback onPrev;
  final VoidCallback onNext;

  @override
  Widget build(BuildContext context) {
    if (totalPage <= 1) return const SizedBox.shrink();
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 12),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          IconButton(
            onPressed: page > 0 ? onPrev : null,
            icon: const Icon(Icons.chevron_left),
          ),
          Text(
            'common.page_indicator'.tr(
              namedArgs: {
                'current': (page + 1).toString(),
                'total': totalPage.toString(),
              },
            ),
            style: const TextStyle(color: AppColors.textSecondary),
          ),
          IconButton(
            onPressed: page < totalPage - 1 ? onNext : null,
            icon: const Icon(Icons.chevron_right),
          ),
        ],
      ),
    );
  }
}
