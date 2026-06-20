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
