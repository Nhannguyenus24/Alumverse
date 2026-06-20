import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../../core/router/route_names.dart';
import '../../../../../core/theme/app_colors.dart';
import '../../../../../shared/widgets/app_toast.dart';
import '../../../../../shared/widgets/empty_view.dart';
import '../../data/repositories/network_repository.dart';
import '../providers/network_provider.dart';
import '../widgets/conversation_request_card.dart';
import '../widgets/network_search_bar.dart';

class NetworkRequestsTab extends ConsumerStatefulWidget {
  const NetworkRequestsTab({super.key});

  @override
  ConsumerState<NetworkRequestsTab> createState() => _NetworkRequestsTabState();
}

class _NetworkRequestsTabState extends ConsumerState<NetworkRequestsTab> {
  final _loadingIds = <int>{};

  Future<void> _respond(int id, String status, String name) async {
    final action = status == 'ACCEPTED' ? 'Chấp nhận' : 'Từ chối';
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text('$action yêu cầu'),
        content: Text('$action yêu cầu kết nối từ $name?'),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(ctx, false),
              child: const Text('Huỷ')),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: Text(
              action,
              style: TextStyle(
                  color: status == 'ACCEPTED'
                      ? AppColors.primary
                      : AppColors.error),
            ),
          ),
        ],
      ),
    );
    if (confirm != true) return;

    setState(() => _loadingIds.add(id));
    try {
      await ref
          .read(networkRepositoryProvider)
          .respondRequest(id: id, status: status);
      ref.invalidate(networkRequestsProvider);
      if (status == 'ACCEPTED') ref.invalidate(networkConnectionsProvider);
      if (mounted) {
        AppToast.success(
            context, status == 'ACCEPTED' ? 'Đã chấp nhận kết nối' : 'Đã từ chối');
      }
    } catch (e) {
      if (mounted) AppToast.fromError(context, e);
    } finally {
      if (mounted) setState(() => _loadingIds.remove(id));
    }
  }

  @override
  Widget build(BuildContext context) {
    final query = ref.watch(networkRequestsQueryProvider);
    final async = ref.watch(networkRequestsProvider);

    return Column(
      children: [
        NetworkSearchBar(
          hintText: 'Tìm theo tên…',
          initialValue: query.fullName,
          onSubmit: (v) => ref
              .read(networkRequestsQueryProvider.notifier)
              .state = query.copyWith(fullName: v).resetPage(),
        ),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
          child: Row(
            children: [
              _FilterChip(
                label: 'Tất cả',
                selected: query.status == null,
                onTap: () => ref
                    .read(networkRequestsQueryProvider.notifier)
                    .state = query.copyWith(clearStatus: true).resetPage(),
              ),
              const SizedBox(width: 8),
              _FilterChip(
                label: 'Chờ xác nhận',
                selected: query.status == 'PENDING',
                onTap: () => ref
                    .read(networkRequestsQueryProvider.notifier)
                    .state =
                    query.copyWith(status: 'PENDING').resetPage(),
              ),
              const SizedBox(width: 8),
              _FilterChip(
                label: 'Đã từ chối',
                selected: query.status == 'REJECTED',
                onTap: () => ref
                    .read(networkRequestsQueryProvider.notifier)
                    .state =
                    query.copyWith(status: 'REJECTED').resetPage(),
              ),
            ],
          ),
        ),
        Expanded(
          child: async.when(
            loading: () =>
                const Center(child: CircularProgressIndicator()),
            error: (e, _) => Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.error_outline,
                      color: AppColors.error, size: 40),
                  const SizedBox(height: 8),
                  Text('$e',
                      style: const TextStyle(
                          color: AppColors.textSecondary),
                      textAlign: TextAlign.center),
                  const SizedBox(height: 12),
                  ElevatedButton(
                    onPressed: () =>
                        ref.invalidate(networkRequestsProvider),
                    child: const Text('Thử lại'),
                  ),
                ],
              ),
            ),
            data: (result) {
              if (result.items.isEmpty) {
                return const EmptyView(
                  icon: Icons.mark_email_unread_outlined,
                  title: 'Chưa có yêu cầu kết nối',
                  message: 'Các lời mời kết nối gửi đến sẽ xuất hiện ở đây.',
                );
              }
              return RefreshIndicator(
                onRefresh: () async =>
                    ref.invalidate(networkRequestsProvider),
                child: ListView.builder(
                  padding: const EdgeInsets.only(bottom: 16),
                  itemCount: result.items.length + 1,
                  itemBuilder: (ctx, i) {
                    if (i == result.items.length) {
                      return _PaginationBar(
                        page: query.page,
                        totalPage: result.totalPage,
                        onPrev: () => ref
                            .read(networkRequestsQueryProvider.notifier)
                            .state =
                            query.copyWith(page: query.page - 1),
                        onNext: () => ref
                            .read(networkRequestsQueryProvider.notifier)
                            .state =
                            query.copyWith(page: query.page + 1),
                      );
                    }
                    final req = result.items[i];
                    return ConversationRequestCard(
                      request: req,
                      isLoading: _loadingIds.contains(req.id),
                      onAccept: () =>
                          _respond(req.id, 'ACCEPTED', req.fullName),
                      onReject: () =>
                          _respond(req.id, 'REJECTED', req.fullName),
                      onViewProfile: () => context
                          .push('${RouteNames.profile}/${req.requesterMemberId}'),
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

class _FilterChip extends StatelessWidget {
  const _FilterChip({
    required this.label,
    required this.selected,
    required this.onTap,
  });

  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding:
            const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: selected
              ? AppColors.primary
              : AppColors.background,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: selected ? AppColors.primary : AppColors.divider,
          ),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w500,
            color: selected ? Colors.white : AppColors.textSecondary,
          ),
        ),
      ),
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
          Text('Trang ${page + 1} / $totalPage',
              style: const TextStyle(color: AppColors.textSecondary)),
          IconButton(
            onPressed: page < totalPage - 1 ? onNext : null,
            icon: const Icon(Icons.chevron_right),
          ),
        ],
      ),
    );
  }
}
