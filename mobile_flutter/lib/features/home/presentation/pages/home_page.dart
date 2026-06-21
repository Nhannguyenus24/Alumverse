import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/router/route_names.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/utils/image_url.dart';
import '../../../article/presentation/providers/news_provider.dart';
import '../../../auth/presentation/providers/auth_provider.dart';
import '../../../event/presentation/providers/event_provider.dart';
import '../../../network/presentation/providers/network_provider.dart';
import '../../../organization/presentation/providers/organization_provider.dart';
import '../../../user/presentation/providers/user_providers.dart';
import '../../../user/presentation/widgets/notification_bell.dart';
import '../../../../shared/widgets/anchored_dropdown.dart';
import '../widgets/community_section.dart';
import '../widgets/events_section.dart';
import '../widgets/explore_section.dart';
import '../widgets/hero_banner.dart';
import '../widgets/news_section.dart';

/// Home feed — the authenticated landing screen. Native take on the web
/// `HomePage.jsx`: hero, explore, news (live from API), notable alumni,
/// partners. Pull to refresh reloads the news.
class HomePage extends ConsumerWidget {
  const HomePage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final org = ref.watch(organizationStateProvider).valueOrNull;
    final user = ref.watch(authStateProvider).valueOrNull?.user;

    return Scaffold(
      appBar: AppBar(
        titleSpacing: 16,
        title: Row(
          children: [
            const Icon(Icons.school_rounded, color: AppColors.primary),
            const SizedBox(width: 8),
            Text(
              'AlumVerse',
              style: TextStyle(
                color: AppColors.primary,
                fontWeight: FontWeight.bold,
                fontSize: 20,
                letterSpacing: 0.5,
              ),
            ),
          ],
        ),
        actions: [
          _OrgSwitchButton(currentName: org?.name),
          const NotificationBell(),
          _AccountMenuButton(
            userLabel: user?.fullName ?? user?.email ?? 'Tài khoản',
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(publishedNewsProvider);
          ref.invalidate(upcomingEventsProvider);
          ref.invalidate(featuredMembersProvider);
          await ref.read(publishedNewsProvider.future);
        },
        child: ListView(
          padding: EdgeInsets.zero,
          children: [
            HeroBanner(organizationName: org?.name),
            const SizedBox(height: 8),
            const ExploreSection(),
            const EventsSection(),
            const NewsSection(),
            const CommunitySection(),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }
}

/// Account avatar button in the AppBar. Opens an anchored dropdown (with a
/// caret pointing at the icon) for profile / settings / logout.
class _AccountMenuButton extends ConsumerWidget {
  const _AccountMenuButton({required this.userLabel});

  final String userLabel;

  Future<void> _open(BuildContext context, WidgetRef ref) async {
    await showAnchoredDropdown<void>(
      anchorContext: context,
      width: 240,
      builder: (_, close) => Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 14, 16, 10),
            child: Text(
              userLabel,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(fontWeight: FontWeight.w700),
            ),
          ),
          const Divider(height: 1),
          ListTile(
            leading: const Icon(Icons.person_outline),
            title: const Text('Hồ sơ của tôi'),
            onTap: () {
              close();
              context.go(RouteNames.profile);
            },
          ),
          ListTile(
            leading: const Icon(Icons.favorite_border_rounded),
            title: const Text('Bài viết đã lưu'),
            onTap: () {
              close();
              context.push(RouteNames.savedArticles);
            },
          ),
          ListTile(
            leading: const Icon(Icons.settings_outlined),
            title: const Text('Cài đặt'),
            onTap: () {
              close();
              context.push(RouteNames.settings);
            },
          ),
          const Divider(height: 1),
          ListTile(
            leading: const Icon(Icons.logout, color: AppColors.error),
            title: const Text('Đăng xuất',
                style: TextStyle(color: AppColors.error)),
            onTap: () async {
              close();
              await ref.read(authStateProvider.notifier).logout();
              if (context.mounted) context.go(RouteNames.login);
            },
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // Show the user's avatar instead of a generic icon (falls back to an icon
    // while loading or when no avatar is set).
    final avatar = resolveImageUrl(
      ref.watch(myProfileProvider).valueOrNull?.avatarUrl,
    );
    return IconButton(
      tooltip: 'Tài khoản',
      onPressed: () => _open(context, ref),
      icon: CircleAvatar(
        radius: 15,
        backgroundColor: AppColors.primary.withValues(alpha: 0.12),
        backgroundImage:
            avatar != null ? CachedNetworkImageProvider(avatar) : null,
        child: avatar == null
            ? const Icon(Icons.person, size: 18, color: AppColors.primary)
            : null,
      ),
    );
  }
}

/// Organisation switcher in the header. Opens an anchored dropdown of available
/// organisations and switches at runtime (no re-login) via the org notifier,
/// then refreshes org-scoped feeds.
class _OrgSwitchButton extends ConsumerWidget {
  const _OrgSwitchButton({this.currentName});
  final String? currentName;

  Future<void> _switch(WidgetRef ref, String slug) async {
    await ref.read(organizationStateProvider.notifier).fetchOrganization(slug);
    // Reload everything scoped to the organization.
    ref.invalidate(publishedNewsProvider);
    ref.invalidate(upcomingEventsProvider);
    ref.invalidate(featuredMembersProvider);
  }

  void _open(BuildContext context, WidgetRef ref) {
    showAnchoredDropdown<void>(
      anchorContext: context,
      width: 260,
      builder: (_, close) => Consumer(
        builder: (ctx, r, __) {
          final async = r.watch(organizationListProvider);
          final current = r.watch(organizationStateProvider).valueOrNull;
          return async.when(
            loading: () => const Padding(
              padding: EdgeInsets.all(20),
              child: Center(
                  child: SizedBox(
                      width: 22,
                      height: 22,
                      child: CircularProgressIndicator(strokeWidth: 2))),
            ),
            error: (_, __) => const Padding(
              padding: EdgeInsets.all(16),
              child: Text('Không tải được danh sách tổ chức'),
            ),
            data: (orgs) => Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const Padding(
                  padding: EdgeInsets.fromLTRB(16, 12, 16, 6),
                  child: Text('Chọn tổ chức',
                      style: TextStyle(fontWeight: FontWeight.w700)),
                ),
                const Divider(height: 1),
                for (final o in orgs)
                  ListTile(
                    dense: true,
                    leading: Icon(
                      o.id == current?.id
                          ? Icons.radio_button_checked
                          : Icons.radio_button_unchecked,
                      color: o.id == current?.id
                          ? AppColors.primary
                          : AppColors.textSecondary,
                      size: 20,
                    ),
                    title: Text(o.name,
                        maxLines: 1, overflow: TextOverflow.ellipsis),
                    onTap: o.id == current?.id
                        ? null
                        : () {
                            close();
                            _switch(ref, o.slug);
                          },
                  ),
              ],
            ),
          );
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return IconButton(
      tooltip: currentName != null ? 'Tổ chức: $currentName' : 'Đổi tổ chức',
      onPressed: () => _open(context, ref),
      icon: const Icon(Icons.apartment_rounded),
    );
  }
}
