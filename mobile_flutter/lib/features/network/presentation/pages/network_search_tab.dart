import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../../core/router/route_names.dart';
import '../../../../../core/theme/app_colors.dart';
import '../../../../../shared/widgets/app_toast.dart';
import '../../../../../shared/widgets/empty_view.dart';
import '../../../organization/presentation/providers/organization_provider.dart';
import '../../data/repositories/network_repository.dart';
import '../providers/network_provider.dart';
import '../widgets/message_request_sheet.dart';
import '../widgets/network_member_card.dart';
import '../widgets/network_search_bar.dart';

class NetworkSearchTab extends ConsumerWidget {
  const NetworkSearchTab({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final query = ref.watch(networkSearchQueryProvider);
    final async = ref.watch(networkSearchProvider);
    final organizations =
        ref.watch(organizationListProvider).valueOrNull ?? const [];

    return Column(
      children: [
        NetworkSearchBar(
          hintText: 'network.search_members_hint'.tr(),
          initialValue: query.fullName,
          showFilters: true,
          programValue: query.program,
          majorValue: query.major,
          organizations: organizations,
          selectedOrganizationIds: query.organizationIds,
          onSubmit:
              (v) =>
                  ref.read(networkSearchQueryProvider.notifier).state =
                      query.copyWith(fullName: v).resetPage(),
          onProgramSubmit:
              (v) =>
                  ref.read(networkSearchQueryProvider.notifier).state =
                      query.copyWith(program: v).resetPage(),
          onMajorSubmit:
              (v) =>
                  ref.read(networkSearchQueryProvider.notifier).state =
                      query.copyWith(major: v).resetPage(),
          onOrganizationsChanged:
              (ids) =>
                  ref.read(networkSearchQueryProvider.notifier).state =
                      query.copyWith(organizationIds: ids).resetPage(),
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
                        onPressed: () => ref.invalidate(networkSearchProvider),
                        child: Text('common.retry'.tr()),
                      ),
                    ],
                  ),
                ),
            data: (result) {
              if (result.items.isEmpty) {
                return EmptyView(
                  icon: Icons.person_search_outlined,
                  title: 'network.no_members_title'.tr(),
                  message: 'network.no_members_desc'.tr(),
                );
              }
              return RefreshIndicator(
                onRefresh: () async => ref.invalidate(networkSearchProvider),
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
                                    .read(networkSearchQueryProvider.notifier)
                                    .state = query.copyWith(
                                  page: query.page - 1,
                                ),
                        onNext:
                            () =>
                                ref
                                    .read(networkSearchQueryProvider.notifier)
                                    .state = query.copyWith(
                                  page: query.page + 1,
                                ),
                      );
                    }
                    final member = result.items[i];
                    return NetworkMemberCard(
                      member: member,
                      onMessage:
                          () => showMessageRequestSheet(
                            context,
                            targetMemberId: member.userId,
                            targetName: member.fullName,
                          ),
                      onViewProfile:
                          () => context.push(
                            '${RouteNames.profile}/${member.userId}',
                          ),
                      onBlock:
                          () => _confirmBlock(
                            context,
                            ref,
                            member.userId,
                            member.fullName,
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
              'network.confirm_block_member'.tr(namedArgs: {'name': name}),
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
      ref.invalidate(networkSearchProvider);
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
