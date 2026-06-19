import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../shared/widgets/empty_view.dart';
import '../../../../shared/widgets/error_view.dart';
import '../../../../shared/widgets/skeleton.dart';
import '../../data/models/notification_item.dart';
import '../../data/repositories/user_repository.dart';
import '../providers/user_providers.dart';

/// Notifications — native port of the web `NotificationPage`. Tabs (All /
/// Unread), tap to mark read + follow link, mark-all-read and delete-all.
class NotificationsPage extends ConsumerStatefulWidget {
  const NotificationsPage({super.key});

  @override
  ConsumerState<NotificationsPage> createState() => _NotificationsPageState();
}

class _NotificationsPageState extends ConsumerState<NotificationsPage> {
  bool _unreadOnly = false;

  Future<void> _onTap(NotificationItem n) async {
    if (!n.isRead) {
      try {
        await ref.read(userRepositoryProvider).markRead(n.id);
        ref.invalidate(notificationsProvider);
      } catch (_) {}
    }
    final link = n.link;
    if (link != null && link.isNotEmpty) {
      if (RegExp(r'^https?://').hasMatch(link)) {
        final uri = Uri.tryParse(link);
        if (uri != null) launchUrl(uri, mode: LaunchMode.externalApplication);
      } else if (mounted) {
        context.push(link);
      }
    }
  }

  Future<void> _markAllRead(List<NotificationItem> items) async {
    final repo = ref.read(userRepositoryProvider);
    try {
      await Future.wait(
        items.where((n) => !n.isRead).map((n) => repo.markRead(n.id)),
      );
      ref.invalidate(notificationsProvider);
    } catch (_) {}
  }

  Future<void> _deleteAll() async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Xoá tất cả thông báo'),
        content: const Text('Bạn có chắc muốn xoá toàn bộ thông báo?'),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(ctx, false),
              child: const Text('Hủy')),
          ElevatedButton(
              onPressed: () => Navigator.pop(ctx, true),
              child: const Text('Xoá tất cả')),
        ],
      ),
    );
    if (ok != true) return;
    try {
      await ref.read(userRepositoryProvider).deleteAllNotifications();
      ref.invalidate(notificationsProvider);
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) {
    final async = ref.watch(notificationsProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Thông báo'),
        actions: [
          PopupMenuButton<String>(
            onSelected: (v) {
              final items = async.valueOrNull ?? const [];
              if (v == 'read_all') _markAllRead(items);
              if (v == 'delete_all') _deleteAll();
            },
            itemBuilder: (_) => const [
              PopupMenuItem(
                  value: 'read_all', child: Text('Đánh dấu tất cả đã đọc')),
              PopupMenuItem(value: 'delete_all', child: Text('Xoá tất cả')),
            ],
          ),
        ],
      ),
      body: async.when(
        loading: () => ListView(
          children: List.generate(6, (_) => const SkeletonTile()),
        ),
        error: (_, __) => ErrorView(
          message: 'Không tải được thông báo',
          onRetry: () => ref.invalidate(notificationsProvider),
        ),
        data: (all) {
          final unreadCount = all.where((n) => !n.isRead).length;
          final items =
              _unreadOnly ? all.where((n) => !n.isRead).toList() : all;

          return Column(
            children: [
              Padding(
                padding: const EdgeInsets.all(12),
                child: Row(
                  children: [
                    _FilterChip(
                      label: 'Tất cả',
                      selected: !_unreadOnly,
                      onTap: () => setState(() => _unreadOnly = false),
                    ),
                    const SizedBox(width: 8),
                    _FilterChip(
                      label: 'Chưa đọc ($unreadCount)',
                      selected: _unreadOnly,
                      onTap: () => setState(() => _unreadOnly = true),
                    ),
                  ],
                ),
              ),
              Expanded(
                child: items.isEmpty
                    ? const _Empty()
                    : RefreshIndicator(
                        onRefresh: () async {
                          ref.invalidate(notificationsProvider);
                          await ref.read(notificationsProvider.future);
                        },
                        child: ListView.separated(
                          itemCount: items.length,
                          separatorBuilder: (_, __) =>
                              const Divider(height: 1),
                          itemBuilder: (_, i) => _NotificationTile(
                            item: items[i],
                            onTap: () => _onTap(items[i]),
                          ),
                        ),
                      ),
              ),
            ],
          );
        },
      ),
    );
  }
}

class _FilterChip extends StatelessWidget {
  const _FilterChip(
      {required this.label, required this.selected, required this.onTap});

  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return ChoiceChip(
      label: Text(label),
      selected: selected,
      onSelected: (_) => onTap(),
      selectedColor: AppColors.primary,
      labelStyle: TextStyle(
        color: selected ? Colors.white : AppColors.textPrimary,
        fontWeight: FontWeight.w600,
      ),
    );
  }
}

class _NotificationTile extends StatelessWidget {
  const _NotificationTile({required this.item, required this.onTap});

  final NotificationItem item;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final time = item.createdAt != null
        ? DateFormat('dd/MM/yyyy • HH:mm').format(item.createdAt!)
        : '';

    return InkWell(
      onTap: onTap,
      child: Container(
        color: item.isRead
            ? Colors.transparent
            : AppColors.primary.withValues(alpha: 0.05),
        padding: const EdgeInsets.all(16),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (item.title != null && item.title!.isNotEmpty)
                    Text(
                      item.title!,
                      style: const TextStyle(
                          fontWeight: FontWeight.w700, fontSize: 15),
                    ),
                  if (item.message.isNotEmpty)
                    Padding(
                      padding: const EdgeInsets.only(top: 2),
                      child: Text(
                        item.message,
                        style: TextStyle(
                          fontWeight:
                              item.isRead ? FontWeight.w400 : FontWeight.w600,
                          color: item.isRead
                              ? AppColors.textSecondary
                              : AppColors.textPrimary,
                          height: 1.4,
                        ),
                      ),
                    ),
                  if (time.isNotEmpty)
                    Padding(
                      padding: const EdgeInsets.only(top: 4),
                      child: Text(
                        time,
                        style: TextStyle(
                          fontSize: 12,
                          color: item.isRead
                              ? AppColors.textSecondary
                              : AppColors.primary,
                        ),
                      ),
                    ),
                ],
              ),
            ),
            if (!item.isRead)
              Container(
                margin: const EdgeInsets.only(top: 4, left: 8),
                width: 10,
                height: 10,
                decoration: const BoxDecoration(
                  color: AppColors.primary,
                  shape: BoxShape.circle,
                ),
              ),
          ],
        ),
      ),
    );
  }
}

class _Empty extends StatelessWidget {
  const _Empty();

  @override
  Widget build(BuildContext context) {
    return const EmptyView(
      icon: Icons.notifications_none_rounded,
      title: 'Bạn đã xem hết thông báo',
      message: 'Thông báo mới về sự kiện, diễn đàn sẽ xuất hiện ở đây.',
    );
  }
}
