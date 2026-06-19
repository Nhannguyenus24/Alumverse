import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/router/route_names.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../shared/widgets/app_toast.dart';
import '../../../../shared/widgets/error_view.dart';
import '../../../auth/presentation/providers/auth_provider.dart';
import '../../data/models/notification_settings.dart';
import '../../data/repositories/user_repository.dart';
import '../providers/user_providers.dart';

/// Settings — native port of the web `SettingPage` (core sections):
/// account actions (edit profile, change password) + notification toggles.
class SettingsPage extends ConsumerWidget {
  const SettingsPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final settingsAsync = ref.watch(notificationSettingsProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Cài đặt')),
      body: ListView(
        children: [
          const _GroupHeader('Tài khoản'),
          ListTile(
            leading: const Icon(Icons.person_outline),
            title: const Text('Chỉnh sửa hồ sơ'),
            trailing: const Icon(Icons.chevron_right),
            onTap: () => context.push(RouteNames.profileEdit),
          ),
          ListTile(
            leading: const Icon(Icons.lock_outline),
            title: const Text('Đổi mật khẩu'),
            trailing: const Icon(Icons.chevron_right),
            onTap: () => context.push(RouteNames.resetPassword),
          ),
          ListTile(
            leading: const Icon(Icons.verified_user_outlined),
            title: const Text('Xác thực tài khoản'),
            subtitle: const Text('Cung cấp minh chứng để dùng đầy đủ tính năng'),
            trailing: const Icon(Icons.chevron_right),
            onTap: () => context.push(RouteNames.organizationRegistration),
          ),
          const Divider(),
          const _GroupHeader('Thông báo'),
          settingsAsync.when(
            loading: () => const Padding(
              padding: EdgeInsets.all(24),
              child: Center(child: CircularProgressIndicator()),
            ),
            error: (_, __) => ErrorView(
              message: 'Không tải được cài đặt thông báo',
              onRetry: () => ref.invalidate(notificationSettingsProvider),
            ),
            data: (s) => _NotificationToggles(initial: s),
          ),
          const Divider(),
          const _GroupHeader('Phiên đăng nhập'),
          ListTile(
            leading: const Icon(Icons.logout, color: AppColors.error),
            title: const Text('Đăng xuất',
                style: TextStyle(color: AppColors.error)),
            onTap: () async {
              await ref.read(authStateProvider.notifier).logout();
              if (context.mounted) context.go(RouteNames.login);
            },
          ),
        ],
      ),
    );
  }
}

class _NotificationToggles extends ConsumerStatefulWidget {
  const _NotificationToggles({required this.initial});

  final NotificationSettings initial;

  @override
  ConsumerState<_NotificationToggles> createState() =>
      _NotificationTogglesState();
}

class _NotificationTogglesState extends ConsumerState<_NotificationToggles> {
  late NotificationSettings _s = widget.initial;
  bool _saving = false;

  Future<void> _update(NotificationSettings next) async {
    final prev = _s;
    setState(() {
      _s = next;
      _saving = true;
    });
    try {
      await ref.read(userRepositoryProvider).updateNotificationSettings(next);
    } catch (_) {
      // Revert on failure.
      if (mounted) {
        setState(() => _s = prev);
        AppToast.error(context, 'Cập nhật cài đặt thất bại');
      }
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        _toggle('Trả lời diễn đàn', _s.forumReplyEnabled,
            (v) => _update(_s.copyWith(forumReplyEnabled: v))),
        _toggle('Nhắc nhở sự kiện', _s.eventReminderEnabled,
            (v) => _update(_s.copyWith(eventReminderEnabled: v))),
        _toggle('Tin tức', _s.newsEnabled,
            (v) => _update(_s.copyWith(newsEnabled: v))),
        _toggle('Thông báo qua email', _s.emailEnabled,
            (v) => _update(_s.copyWith(emailEnabled: v))),
        _toggle('Thông báo đẩy (Push)', _s.pushEnabled,
            (v) => _update(_s.copyWith(pushEnabled: v))),
      ],
    );
  }

  Widget _toggle(String title, bool value, ValueChanged<bool> onChanged) {
    return SwitchListTile(
      title: Text(title),
      value: value,
      activeColor: AppColors.primary,
      onChanged: _saving ? null : onChanged,
    );
  }
}

class _GroupHeader extends StatelessWidget {
  const _GroupHeader(this.text);

  final String text;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 4),
      child: Text(
        text.toUpperCase(),
        style: const TextStyle(
          fontSize: 12,
          fontWeight: FontWeight.w700,
          color: AppColors.textSecondary,
          letterSpacing: 0.5,
        ),
      ),
    );
  }
}
