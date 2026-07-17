import 'package:cached_network_image/cached_network_image.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/router/route_names.dart';
import '../../../../main.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/utils/image_url.dart';
import '../../../article/presentation/providers/news_provider.dart';
import '../../../auth/presentation/providers/auth_provider.dart';
import '../../../event/presentation/providers/event_provider.dart';
import '../../../network/presentation/providers/network_provider.dart';
import '../../../organization/data/repositories/organization_repository.dart';
import '../../../organization/presentation/providers/organization_provider.dart';
import '../../../user/presentation/providers/user_providers.dart';
import '../../../user/presentation/widgets/notification_bell.dart';
import '../../../../shared/widgets/anchored_dropdown.dart';
import '../../../../shared/widgets/logo.dart';
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

    return Scaffold(
      appBar: AppBar(
        titleSpacing: 16,
        title: Row(children: [const AlumverseLogo(size: 30)]),
        actions: [
          _OrgSwitchButton(currentName: org?.name),
          const _LanguageSwitchButton(),
          const NotificationBell(),
          const _AccountMenuButton(),
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

/// Language switcher button in the AppBar. Toggles between vi and en.
class _LanguageSwitchButton extends StatelessWidget {
  const _LanguageSwitchButton();

  @override
  Widget build(BuildContext context) {
    final isVi = context.locale.languageCode == 'vi';
    return IconButton(
      tooltip: isVi ? 'English' : 'Tiếng Việt',
      onPressed: () async {
        final next = isVi ? const Locale('en') : const Locale('vi');
        await context.setLocale(next);
        if (context.mounted) AppRoot.of(context).rebuild();
      },
      icon: Text(isVi ? '🇻🇳' : '🇺🇸', style: const TextStyle(fontSize: 20)),
    );
  }
}

/// Account avatar button in the AppBar. Opens an anchored dropdown (with a
/// caret pointing at the icon) for profile / settings / logout.
class _AccountMenuButton extends ConsumerWidget {
  const _AccountMenuButton();

  Future<void> _open(BuildContext context, WidgetRef ref) async {
    final authUser = ref.read(authStateProvider).valueOrNull?.user;
    final profile = ref.read(myProfileProvider).valueOrNull;
    final fullName =
        profile?.fullName?.trim().isNotEmpty == true
            ? profile!.fullName!.trim()
            : authUser?.fullName?.trim().isNotEmpty == true
            ? authUser!.fullName!.trim()
            : 'profile.title'.tr();
    final role =
        profile?.role?.trim().isNotEmpty == true
            ? profile!.role!.trim()
            : authUser?.role?.trim();
    final email =
        profile?.email.trim().isNotEmpty == true
            ? profile!.email.trim()
            : authUser?.email ?? '';

    await showAnchoredDropdown<void>(
      anchorContext: context,
      width: 280,
      builder:
          (_, close) => Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 14, 16, 10),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      fullName,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(fontWeight: FontWeight.w800),
                    ),
                    if (role != null && role.isNotEmpty) ...[
                      const SizedBox(height: 2),
                      Text(
                        role.toUpperCase(),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          color: AppColors.primary,
                          fontSize: 12,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ],
                    if (email.isNotEmpty) ...[
                      const SizedBox(height: 2),
                      Text(
                        email,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          color: AppColors.textSecondary,
                          fontSize: 12.5,
                        ),
                      ),
                    ],
                  ],
                ),
              ),
              const Divider(height: 1),
              ListTile(
                leading: const Icon(Icons.person_outline),
                title: Text('profile.my_profile'.tr()),
                onTap: () {
                  close();
                  context.go(RouteNames.profile);
                },
              ),
              ListTile(
                leading: const Icon(Icons.favorite_border_rounded),
                title: Text('article.saved'.tr()),
                onTap: () {
                  close();
                  context.push(RouteNames.savedArticles);
                },
              ),
              ListTile(
                leading: const Icon(Icons.settings_outlined),
                title: Text('common.settings'.tr()),
                onTap: () {
                  close();
                  context.push(RouteNames.settings);
                },
              ),
              const Divider(height: 1),
              ListTile(
                leading: const Icon(Icons.logout, color: AppColors.error),
                title: Text(
                  'common.logout'.tr(),
                  style: const TextStyle(color: AppColors.error),
                ),
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
    final authAvatar =
        ref.watch(authStateProvider).valueOrNull?.user?.avatarUrl;
    final avatar = resolveImageUrl(
      ref.watch(myProfileProvider).valueOrNull?.avatarUrl ?? authAvatar,
    );
    return IconButton(
      tooltip: 'profile.title'.tr(),
      onPressed: () => _open(context, ref),
      icon: CircleAvatar(
        radius: 15,
        backgroundColor: AppColors.primaryLighter,
        backgroundImage:
            avatar != null ? CachedNetworkImageProvider(avatar) : null,
        child:
            avatar == null
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

  Future<void> _switch(BuildContext context, WidgetRef ref, String slug) async {
    _showSwitchingOverlay(context);
    var overlayOpen = true;
    void closeOverlay() {
      if (overlayOpen && context.mounted) {
        overlayOpen = false;
        Navigator.of(context, rootNavigator: true).pop();
      }
    }

    final isLoggedIn =
        ref.read(authStateProvider).valueOrNull?.isLoggedIn ?? false;
    try {
      if (isLoggedIn) {
        final nextOrg = await ref
            .read(organizationRepositoryProvider)
            .getOrganizationBySlug(slug);
        await ref
            .read(authStateProvider.notifier)
            .switchOrganization(nextOrg.id);
      }
      await ref
          .read(organizationStateProvider.notifier)
          .fetchOrganization(slug);
      ref.invalidate(myVerificationLevelProvider);
      ref.invalidate(isOrgManagerProvider);
      ref.invalidate(canEventCheckInProvider);
      ref.invalidate(canContributeProvider);
      ref.invalidate(isTrustedVerifierProvider);
      // Reload everything scoped to the organization.
      ref.invalidate(publishedNewsProvider);
      ref.invalidate(upcomingEventsProvider);
      ref.invalidate(featuredMembersProvider);
      await Future.wait([
        ref
            .read(publishedNewsProvider.future)
            .then<void>((_) {})
            .catchError((_) {}),
        ref
            .read(upcomingEventsProvider.future)
            .then<void>((_) {})
            .catchError((_) {}),
        ref
            .read(featuredMembersProvider.future)
            .then<void>((_) {})
            .catchError((_) {}),
      ]);
    } finally {
      closeOverlay();
    }
  }

  void _showSwitchingOverlay(BuildContext context) {
    showDialog<void>(
      context: context,
      barrierDismissible: false,
      barrierColor: Colors.white,
      useRootNavigator: true,
      builder:
          (_) => const PopScope(
            canPop: false,
            child: Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  AlumverseLogo(size: 84, full: false),
                  SizedBox(height: 32),
                  CircularProgressIndicator(),
                ],
              ),
            ),
          ),
    );
  }

  void _open(BuildContext context, WidgetRef ref) {
    showAnchoredDropdown<void>(
      anchorContext: context,
      width: 260,
      builder:
          (_, close) => Consumer(
            builder: (ctx, r, __) {
              final async = r.watch(organizationListProvider);
              final current = r.watch(organizationStateProvider).valueOrNull;
              return async.when(
                loading:
                    () => const Padding(
                      padding: EdgeInsets.all(20),
                      child: Center(
                        child: SizedBox(
                          width: 22,
                          height: 22,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        ),
                      ),
                    ),
                error:
                    (_, __) => Padding(
                      padding: const EdgeInsets.all(16),
                      child: Text('organization.load_failed'.tr()),
                    ),
                data:
                    (orgs) => Column(
                      mainAxisSize: MainAxisSize.min,
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        Padding(
                          padding: const EdgeInsets.fromLTRB(16, 12, 16, 6),
                          child: Text(
                            'organization.select'.tr(),
                            style: const TextStyle(fontWeight: FontWeight.w700),
                          ),
                        ),
                        const Divider(height: 1),
                        for (final o in orgs)
                          ListTile(
                            dense: true,
                            leading: Icon(
                              o.id == current?.id
                                  ? Icons.radio_button_checked
                                  : Icons.radio_button_unchecked,
                              color:
                                  o.id == current?.id
                                      ? AppColors.primary
                                      : AppColors.textSecondary,
                              size: 20,
                            ),
                            title: Text(
                              o.name,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                            onTap:
                                o.id == current?.id
                                    ? null
                                    : () {
                                      close();
                                      _switch(context, ref, o.slug);
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
      tooltip:
          currentName != null
              ? 'home.org_tooltip'.tr(namedArgs: {'name': currentName!})
              : 'common.change_org'.tr(),
      onPressed: () => _open(context, ref),
      icon: const Icon(Icons.apartment_rounded),
    );
  }
}
