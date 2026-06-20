import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../../core/router/route_names.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../shared/widgets/anchored_dropdown.dart';
import '../../data/models/notification_item.dart';
import '../../data/repositories/user_repository.dart';
import '../providers/user_providers.dart';

/// Notification bell for the home AppBar: shows an unread-count badge and, on
/// tap, opens a dropdown of the 5 most recent notifications with a "Đánh dấu
/// tất cả đã đọc" action and a "Tất cả" link to the full page. Mirrors the web
/// notification dropdown rather than navigating to a separate screen.
class NotificationBell extends ConsumerWidget {
  const NotificationBell({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(notificationsProvider);
    final all = async.valueOrNull ?? const <NotificationItem>[];
    final unread = all.where((n) => !n.isRead).length;

    return _BellButton(unread: unread);
  }
}

class _BellButton extends ConsumerStatefulWidget {
  const _BellButton({required this.unread});
  final int unread;

  @override
  ConsumerState<_BellButton> createState() => _BellButtonState();
}

class _BellButtonState extends ConsumerState<_BellButton> {
  Future<void> _open() async {
    await showAnchoredDropdown<void>(
      anchorContext: context,
      width: 320,
      builder: (_, close) => _NotificationDropdown(onClose: close),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Stack(
      clipBehavior: Clip.none,
      children: [
        IconButton(
          tooltip: 'Thông báo',
          icon: const Icon(Icons.notifications_none_rounded),
          onPressed: _open,
        ),
        if (widget.unread > 0)
          Positioned(
            right: 6,
            top: 6,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
              constraints: const BoxConstraints(minWidth: 18, minHeight: 18),
              decoration: BoxDecoration(
                color: AppColors.error,
                borderRadius: BorderRadius.circular(9),
                border: Border.all(color: AppColors.surface, width: 1.5),
              ),
              child: Text(
                widget.unread > 99 ? '99+' : '${widget.unread}',
                textAlign: TextAlign.center,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 10,
                  fontWeight: FontWeight.w700,
                  height: 1.2,
                ),
              ),
            ),
          ),
      ],
    );
  }
}

class _NotificationDropdown extends ConsumerWidget {
  const _NotificationDropdown({required this.onClose});
  final VoidCallback onClose;

  Future<void> _markAllRead(WidgetRef ref) async {
    final repo = ref.read(userRepositoryProvider);
    final items = ref.read(notificationsProvider).valueOrNull ?? const [];
    try {
      await Future.wait(
        items.where((n) => !n.isRead).map((n) => repo.markRead(n.id)),
      );
      ref.invalidate(notificationsProvider);
    } catch (_) {}
  }

  Future<void> _onTap(
      BuildContext context, WidgetRef ref, NotificationItem n) async {
    onClose();
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
        if (uri != null) {
          launchUrl(uri, mode: LaunchMode.externalApplication);
        }
      } else if (context.mounted) {
        context.push(link);
      }
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(notificationsProvider);
    final all = async.valueOrNull ?? const <NotificationItem>[];
    final recent = all.take(5).toList();
    final unread = all.where((n) => !n.isRead).length;

    return SizedBox(
      width: 320,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Header
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 8, 8),
            child: Row(
              children: [
                const Expanded(
                  child: Text('Thông báo',
                      style: TextStyle(
                          fontWeight: FontWeight.w700, fontSize: 16)),
                ),
                if (unread > 0)
                  TextButton(
                    onPressed: () => _markAllRead(ref),
                    style: TextButton.styleFrom(
                      padding: const EdgeInsets.symmetric(horizontal: 8),
                      minimumSize: const Size(0, 32),
                      tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                    ),
                    child: const Text('Đánh dấu đã đọc',
                        style: TextStyle(fontSize: 12)),
                  ),
              ],
            ),
          ),
          const Divider(height: 1),

          // List (5 most recent) or empty
          if (async.isLoading)
            const Padding(
              padding: EdgeInsets.all(24),
              child: Center(
                  child: SizedBox(
                      width: 22,
                      height: 22,
                      child: CircularProgressIndicator(strokeWidth: 2))),
            )
          else if (recent.isEmpty)
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 28, horizontal: 16),
              child: Column(
                children: [
                  Icon(Icons.notifications_none_rounded,
                      size: 36, color: AppColors.textSecondary),
                  SizedBox(height: 8),
                  Text('Chưa có thông báo',
                      style: TextStyle(color: AppColors.textSecondary)),
                ],
              ),
            )
          else
            for (var i = 0; i < recent.length; i++) ...[
              if (i > 0)
                Divider(
                  height: 1,
                  thickness: 1,
                  indent: 16,
                  endIndent: 16,
                  color: AppColors.divider.withValues(alpha: 0.6),
                ),
              _DropdownTile(
                item: recent[i],
                onTap: () => _onTap(context, ref, recent[i]),
              ),
            ],

          const Divider(height: 1),
          // Footer: "Tất cả"
          InkWell(
            onTap: () {
              onClose();
              context.push(RouteNames.notifications);
            },
            child: const Padding(
              padding: EdgeInsets.symmetric(vertical: 12),
              child: Center(
                child: Text('Tất cả',
                    style: TextStyle(
                        color: AppColors.primary,
                        fontWeight: FontWeight.w600)),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _DropdownTile extends StatelessWidget {
  const _DropdownTile({required this.item, required this.onTap});
  final NotificationItem item;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final time = item.createdAt != null
        ? DateFormat('dd/MM • HH:mm').format(item.createdAt!)
        : '';
    return InkWell(
      onTap: onTap,
      child: Container(
        color: item.isRead
            ? Colors.transparent
            : AppColors.primary.withValues(alpha: 0.05),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              margin: const EdgeInsets.only(top: 5, right: 8),
              width: 8,
              height: 8,
              decoration: BoxDecoration(
                color: item.isRead ? Colors.transparent : AppColors.primary,
                shape: BoxShape.circle,
              ),
            ),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (item.title != null && item.title!.isNotEmpty)
                    Text(item.title!,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(
                            fontWeight:
                                item.isRead ? FontWeight.w600 : FontWeight.w700,
                            fontSize: 13.5)),
                  if (item.message.isNotEmpty)
                    Text(item.message,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(
                            fontSize: 12.5,
                            height: 1.35,
                            color: item.isRead
                                ? AppColors.textSecondary
                                : AppColors.textPrimary)),
                  if (time.isNotEmpty)
                    Padding(
                      padding: const EdgeInsets.only(top: 2),
                      child: Text(time,
                          style: const TextStyle(
                              fontSize: 11, color: AppColors.textSecondary)),
                    ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
