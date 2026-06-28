import 'package:easy_localization/easy_localization.dart';
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
    final isStaff = ref.watch(isStaffProvider);

    return Scaffold(
      appBar: AppBar(title: Text('common.settings'.tr())),
      body: ListView(
        children: [
          if (isStaff) ...[
            _GroupHeader('settings.admin_tools'.tr()),
            ListTile(
              leading: const Icon(Icons.qr_code_scanner),
              title: Text('settings.event_checkin'.tr()),
              subtitle: Text('settings.event_checkin_subtitle'.tr()),
              trailing: const Icon(Icons.chevron_right),
              onTap: () => context.push(RouteNames.adminCheckIn),
            ),
            const Divider(),
          ],
          _GroupHeader('settings.account'.tr()),
          ListTile(
            leading: const Icon(Icons.person_outline),
            title: Text('profile.edit_profile'.tr()),
            trailing: const Icon(Icons.chevron_right),
            onTap: () => context.push(RouteNames.profileEdit),
          ),
          ListTile(
            leading: const Icon(Icons.lock_outline),
            title: Text('profile.change_password'.tr()),
            trailing: const Icon(Icons.chevron_right),
            onTap: () => context.push(RouteNames.resetPassword),
          ),
          ListTile(
            leading: const Icon(Icons.verified_user_outlined),
            title: Text('auth.verify_account'.tr()),
            subtitle: Text('settings.verify_subtitle'.tr()),
            trailing: const Icon(Icons.chevron_right),
            onTap: () => context.push(RouteNames.organizationRegistration),
          ),
          const Divider(),
          _GroupHeader('profile.notification_settings'.tr()),
          settingsAsync.when(
            loading: () => const Padding(
              padding: EdgeInsets.all(24),
              child: Center(child: CircularProgressIndicator()),
            ),
            error: (_, __) => ErrorView(
              message: 'settings.load_notif_failed'.tr(),
              onRetry: () => ref.invalidate(notificationSettingsProvider),
            ),
            data: (s) => _NotificationToggles(initial: s),
          ),
          const Divider(),
          _GroupHeader('settings.session'.tr()),
          ListTile(
            leading: const Icon(Icons.logout, color: AppColors.error),
            title: Text('auth.logout'.tr(),
                style: const TextStyle(color: AppColors.error)),
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
        AppToast.error(context, 'settings.update_failed'.tr());
      }
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        _toggle('settings.notif_forum_reply'.tr(), _s.forumReplyEnabled,
            (v) => _update(_s.copyWith(forumReplyEnabled: v))),
        _toggle('settings.notif_event_reminder'.tr(), _s.eventReminderEnabled,
            (v) => _update(_s.copyWith(eventReminderEnabled: v))),
        _toggle('settings.notif_news'.tr(), _s.newsEnabled,
            (v) => _update(_s.copyWith(newsEnabled: v))),
        _toggle('settings.notif_email'.tr(), _s.emailEnabled,
            (v) => _update(_s.copyWith(emailEnabled: v))),
        _toggle('settings.notif_push'.tr(), _s.pushEnabled,
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
