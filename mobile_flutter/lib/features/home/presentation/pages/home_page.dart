import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/router/route_names.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../article/presentation/providers/news_provider.dart';
import '../../../auth/presentation/providers/auth_provider.dart';
import '../../../event/presentation/providers/event_provider.dart';
import '../../../network/presentation/providers/network_provider.dart';
import '../../../organization/presentation/providers/organization_provider.dart';
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
          IconButton(
            tooltip: 'Thông báo',
            icon: const Icon(Icons.notifications_none_rounded),
            onPressed: () => context.push(RouteNames.notifications),
          ),
          PopupMenuButton<String>(
            icon: const Icon(Icons.account_circle_outlined),
            onSelected: (value) async {
              switch (value) {
                case 'profile':
                  context.go(RouteNames.profile);
                  break;
                case 'settings':
                  context.push(RouteNames.settings);
                  break;
                case 'logout':
                  await ref.read(authStateProvider.notifier).logout();
                  if (context.mounted) context.go(RouteNames.login);
                  break;
              }
            },
            itemBuilder: (_) => [
              PopupMenuItem(
                enabled: false,
                child: Text(
                  user?.fullName ?? user?.email ?? 'Tài khoản',
                  style: const TextStyle(fontWeight: FontWeight.w600),
                ),
              ),
              const PopupMenuDivider(),
              const PopupMenuItem(
                value: 'profile',
                child: ListTile(
                  contentPadding: EdgeInsets.zero,
                  leading: Icon(Icons.person_outline),
                  title: Text('Hồ sơ của tôi'),
                ),
              ),
              const PopupMenuItem(
                value: 'settings',
                child: ListTile(
                  contentPadding: EdgeInsets.zero,
                  leading: Icon(Icons.settings_outlined),
                  title: Text('Cài đặt'),
                ),
              ),
              const PopupMenuDivider(),
              const PopupMenuItem(
                value: 'logout',
                child: ListTile(
                  contentPadding: EdgeInsets.zero,
                  leading: Icon(Icons.logout, color: AppColors.error),
                  title: Text('Đăng xuất'),
                ),
              ),
            ],
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
