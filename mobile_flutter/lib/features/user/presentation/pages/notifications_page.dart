import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/utils/notification_link.dart';
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
      } else {
        // Map web/org-scoped backend links to the matching mobile route.
        final route = normalizeNotificationLink(link);
        if (route != null && mounted) context.push(route);
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
        title: Text('notification.delete_all_title'.tr()),
        content: Text('notification.delete_all_confirm'.tr()),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(ctx, false),
              child: Text('common.cancel'.tr())),
          ElevatedButton(
              onPressed: () => Navigator.pop(ctx, true),
              child: Text('notification.delete_all_btn'.tr())),
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
        title: Text('common.notifications'.tr()),
        actions: [
          PopupMenuButton<String>(
            onSelected: (v) {
              final items = async.valueOrNull ?? const [];
              if (v == 'read_all') _markAllRead(items);
              if (v == 'delete_all') _deleteAll();
            },
            itemBuilder: (_) => [
              PopupMenuItem(
                  value: 'read_all',
                  child: Text('notification.mark_all_read'.tr())),
              PopupMenuItem(
                  value: 'delete_all',
                  child: Text('notification.delete_all_btn'.tr())),
            ],
          ),
        ],
      ),
      body: async.when(
        loading: () => ListView(
          children: List.generate(6, (_) => const SkeletonTile()),
        ),
        error: (_, __) => ErrorView(
          message: 'notification.load_failed'.tr(),
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
                      label: 'common.all'.tr(),
                      selected: !_unreadOnly,
                      onTap: () => setState(() => _unreadOnly = false),
                    ),
                    const SizedBox(width: 8),
                    _FilterChip(
                      label: 'notification.unread_count'.tr(
                          namedArgs: {'count': unreadCount.toString()}),
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
    return EmptyView(
      icon: Icons.notifications_none_rounded,
      title: 'notification.empty_title'.tr(),
      message: 'notification.empty_message'.tr(),
    );
  }
}
