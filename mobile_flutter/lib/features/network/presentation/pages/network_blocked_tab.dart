import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../../core/theme/app_colors.dart';
import '../../../../../shared/widgets/app_toast.dart';
import '../../../../../shared/widgets/empty_view.dart';
import '../../data/repositories/network_repository.dart';
import '../providers/network_provider.dart';
import '../widgets/blocked_member_card.dart';
import '../widgets/network_search_bar.dart';

class NetworkBlockedTab extends ConsumerStatefulWidget {
  const NetworkBlockedTab({super.key});

  @override
  ConsumerState<NetworkBlockedTab> createState() => _NetworkBlockedTabState();
}

class _NetworkBlockedTabState extends ConsumerState<NetworkBlockedTab> {
  final _loadingIds = <int>{};

  Future<void> _confirmUnblock(int memberId, String name) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder:
          (ctx) => AlertDialog(
            title: Text('network.unblock'.tr()),
            content: Text(
              'network.confirm_unblock'.tr(namedArgs: {'name': name}),
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(ctx, false),
                child: Text('common.cancel'.tr()),
              ),
              TextButton(
                onPressed: () => Navigator.pop(ctx, true),
                child: Text(
                  'network.unblock'.tr(),
                  style: const TextStyle(color: AppColors.primary),
                ),
              ),
            ],
          ),
    );
    if (confirm != true) return;

    setState(() => _loadingIds.add(memberId));
    try {
      await ref.read(networkRepositoryProvider).unblock(memberId);
      ref.invalidate(networkBlockedProvider);
      ref.invalidate(networkConnectionsProvider);
      if (mounted)
        AppToast.success(
          context,
          'network.unblocked_toast'.tr(namedArgs: {'name': name}),
        );
    } catch (e) {
      if (mounted) AppToast.fromError(context, e);
    } finally {
      if (mounted) setState(() => _loadingIds.remove(memberId));
    }
  }

  @override
  Widget build(BuildContext context) {
    final query = ref.watch(networkBlockedQueryProvider);
    final async = ref.watch(networkBlockedProvider);

    return Column(
      children: [
        NetworkSearchBar(
          hintText: 'network.search_blocked_hint'.tr(),
          initialValue: query.fullName,
          onSubmit:
              (v) =>
                  ref.read(networkBlockedQueryProvider.notifier).state =
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
                        onPressed: () => ref.invalidate(networkBlockedProvider),
                        child: Text('common.retry'.tr()),
                      ),
                    ],
                  ),
                ),
            data: (result) {
              if (result.items.isEmpty) {
                return EmptyView(
                  icon: Icons.block_outlined,
                  title: 'network.no_blocked_title'.tr(),
                  message: 'network.no_blocked_desc'.tr(),
                );
              }
              return RefreshIndicator(
                onRefresh: () async => ref.invalidate(networkBlockedProvider),
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
                                    .read(networkBlockedQueryProvider.notifier)
                                    .state = query.copyWith(
                                  page: query.page - 1,
                                ),
                        onNext:
                            () =>
                                ref
                                    .read(networkBlockedQueryProvider.notifier)
                                    .state = query.copyWith(
                                  page: query.page + 1,
                                ),
                      );
                    }
                    final m = result.items[i];
                    return BlockedMemberCard(
                      member: m,
                      isLoading: _loadingIds.contains(m.blockedMemberId),
                      onUnblock:
                          () => _confirmUnblock(m.blockedMemberId, m.fullName),
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
