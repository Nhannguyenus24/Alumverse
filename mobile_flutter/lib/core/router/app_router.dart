import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../features/auth/presentation/pages/login_page.dart';
import '../../features/auth/presentation/pages/register_page.dart';
import '../../features/auth/presentation/pages/forgot_password_page.dart';
import '../../features/auth/presentation/pages/signup_code_page.dart';
import '../../features/auth/presentation/pages/reset_password_page.dart';
import '../../features/organization/presentation/pages/organization_registration_page.dart';
import '../../features/organization/presentation/pages/organization_select_page.dart';
import '../../features/auth/presentation/providers/auth_provider.dart';
import '../../features/organization/presentation/providers/organization_provider.dart';
import '../../features/chat/presentation/pages/chat_list_page.dart';
import '../../features/chat/presentation/pages/chat_room_page.dart';
import '../../features/chat/presentation/pages/create_group_page.dart';
import '../../features/chat/presentation/pages/group_members_page.dart';
import '../../features/home/presentation/pages/home_page.dart';
import '../../features/home/presentation/pages/splash_page.dart';
import '../../features/article/presentation/pages/article_detail_page.dart';
import '../../features/article/presentation/pages/news_list_page.dart';
import '../../features/article/presentation/pages/saved_articles_page.dart';
import '../../features/event/presentation/pages/events_page.dart';
import '../../features/event/presentation/pages/event_detail_page.dart';
import '../../features/event/presentation/pages/my_tickets_page.dart';
import '../../features/event/presentation/pages/ticket_detail_page.dart';
import '../../features/event/presentation/pages/admin_check_in_events_page.dart';
import '../../features/event/presentation/pages/admin_event_manage_page.dart';
import '../../features/event/presentation/pages/event_check_in_scanner_page.dart';
import '../../features/event/data/models/event_ticket.dart';
import '../../features/organization/presentation/pages/organization_introduction_page.dart';
import '../../features/organization/presentation/pages/alumni_verification_page.dart';
import '../../features/user/presentation/pages/my_profile_page.dart';
import '../../features/user/presentation/pages/my_profile_edit_page.dart';
import '../../features/user/presentation/pages/settings_page.dart';
import '../../features/user/presentation/pages/notifications_page.dart';
import '../../features/forum/presentation/pages/forum_categories_page.dart';
import '../../features/forum/data/models/forum_topic.dart';
import '../../features/forum/presentation/pages/forum_topics_page.dart';
import '../../features/forum/presentation/pages/forum_thread_page.dart';
import '../../features/forum/presentation/pages/forum_create_topic_page.dart';
import '../../features/mentorship/presentation/pages/mentorship_page.dart';
import '../../features/mentorship/presentation/pages/mentor_profile_page.dart';
import '../../features/mentorship/presentation/pages/mentor_booking_page.dart';
import '../../features/mentorship/presentation/pages/my_bookings_page.dart';
import '../../features/mentorship/presentation/pages/mentor_signup_page.dart';
import '../../features/mentorship/presentation/pages/mentor_dashboard_page.dart';
import '../../features/mentorship/presentation/pages/mentor_availability_page.dart';
import '../../features/network/presentation/pages/network_page.dart';
import '../../features/fundraising/presentation/pages/fundraising_list_page.dart';
import '../../features/fundraising/presentation/pages/fundraising_detail_page.dart';
import '../../features/fundraising/presentation/pages/fundraising_donate_page.dart';
import '../../features/fundraising/presentation/pages/my_donations_page.dart';
import '../../features/user/presentation/pages/public_profile_page.dart';
import '../../shared/widgets/main_scaffold.dart';
import 'route_names.dart';

final appRouterProvider = Provider<GoRouter>((ref) {
  // IMPORTANT: build GoRouter ONCE. Use a refreshListenable to re-run `redirect`
  // when auth/org change — instead of `ref.watch`, which would rebuild the whole
  // GoRouter and dispose the current page mid-async (that silently swallowed the
  // login error toast). State is read fresh inside `redirect` via ref.read.
  final refresh = _RouterRefresh(ref);
  ref.onDispose(refresh.dispose);

  return GoRouter(
    initialLocation: RouteNames.splash,
    debugLogDiagnostics: true,
    refreshListenable: refresh,
    redirect: (context, state) {
      final authState = ref.read(authStateProvider);
      final orgState = ref.read(organizationStateProvider);
      final isSplash = state.matchedLocation == RouteNames.splash;

      final isOrgSelectRoute = state.matchedLocation == RouteNames.organizationSelect;
      // Public auth routes (signed-out only). Note: reset-password is the
      // "change password" flow and requires an active session — like the web,
      // it lives behind the auth gate, NOT here.
      // organization-registration requires a logged-in user (joins org with the
      // user id from the JWT), so it is NOT a signed-out-only auth route — it
      // lives behind the auth gate and is reachable from Settings.
      final isAuthRoute = state.matchedLocation == RouteNames.login ||
          state.matchedLocation == RouteNames.register ||
          state.matchedLocation == RouteNames.forgotPassword ||
          state.matchedLocation == RouteNames.signupCode;

      // While auth/org are still resolving, stay on splash — but ONLY during
      // startup (on the splash route). Do NOT bounce the user off an auth/org
      // screen mid-submit (login sets AsyncLoading→AsyncError); that would
      // dispose the form and swallow its error toast.
      final isResolving = authState.isLoading || orgState.isLoading;
      if (isResolving) {
        if (isSplash) return null;
        if (isAuthRoute || isOrgSelectRoute) return null;
        return RouteNames.splash;
      }

      final isLoggedIn = authState.maybeWhen(
        data: (auth) => auth.isLoggedIn,
        orElse: () => false,
      );

      final hasOrg = orgState.maybeWhen(
        data: (org) => org != null,
        orElse: () => false,
      );
      // 1. No organization selected → must pick one first.
      if (!hasOrg && !isOrgSelectRoute) return RouteNames.organizationSelect;

      // 2. Has organization but sitting on splash/org-select → move forward.
      if (hasOrg && (isOrgSelectRoute || isSplash)) {
        return isLoggedIn ? RouteNames.home : RouteNames.login;
      }

      // 3. Normal auth gate (org-select & splash are exempt — handled above).
      if (!isLoggedIn && !isAuthRoute && !isSplash && !isOrgSelectRoute) {
        return RouteNames.login;
      }
      if (isLoggedIn && isAuthRoute) return RouteNames.home;

      return null;
    },
    routes: [
      GoRoute(
        path: RouteNames.splash,
        builder: (_, __) => const SplashPage(),
      ),
      GoRoute(
        path: RouteNames.organizationSelect,
        builder: (_, __) => const OrganizationSelectPage(),
      ),
      GoRoute(
        path: RouteNames.login,
        builder: (_, __) => const LoginPage(),
      ),
      GoRoute(
        path: RouteNames.register,
        builder: (_, __) => const RegisterPage(),
      ),
      GoRoute(
        path: RouteNames.forgotPassword,
        builder: (_, __) => const ForgotPasswordPage(),
      ),
      GoRoute(
        path: RouteNames.signupCode,
        builder: (_, state) => SignupCodePage(email: state.extra as String? ?? ''),
      ),
      GoRoute(
        path: RouteNames.resetPassword,
        builder: (_, __) => const ResetPasswordPage(),
      ),
      GoRoute(
        path: RouteNames.organizationRegistration,
        builder: (_, __) => const OrganizationRegistrationPage(),
      ),
      GoRoute(
        path: RouteNames.home,
        builder: (_, __) =>
            const MainScaffold(currentIndex: 0, child: HomePage()),
      ),
      GoRoute(
        path: RouteNames.chat,
        builder: (_, __) =>
            const MainScaffold(currentIndex: 4, child: ChatListPage()),
      ),
      // '/chat/new' must be declared BEFORE '/chat/:groupId' so the literal
      // segment 'new' isn't captured as a groupId.
      GoRoute(
        path: '${RouteNames.chat}/new',
        builder: (_, __) => const CreateGroupPage(),
      ),
      // '/chat/:groupId' — opens a conversation. `extra` carries a
      // ChatRoomArgs (title/type/peer); deep links without it fall back to a
      // private chat shell keyed only by the group id.
      GoRoute(
        path: '${RouteNames.chat}/:groupId',
        builder: (_, state) {
          final groupId =
              int.tryParse(state.pathParameters['groupId'] ?? '') ?? 0;
          final args = state.extra is ChatRoomArgs
              ? state.extra as ChatRoomArgs
              : ChatRoomArgs(groupId: groupId);
          return ChatRoomPage(args: args);
        },
      ),
      // '/chat/:groupId/members' — group members management.
      GoRoute(
        path: '${RouteNames.chat}/:groupId/members',
        builder: (_, state) {
          final groupId =
              int.tryParse(state.pathParameters['groupId'] ?? '') ?? 0;
          final title = state.extra as String?;
          return GroupMembersPage(groupId: groupId, groupTitle: title);
        },
      ),
      GoRoute(
        path: '${RouteNames.articles}/:id',
        builder: (_, state) => ArticleDetailPage(
          articleId: int.tryParse(state.pathParameters['id'] ?? '') ?? 0,
        ),
      ),
      // Feature destinations from the home menu. These are placeholders until
      // each feature screen is built; routing works end-to-end now.
      GoRoute(
        path: RouteNames.events,
        builder: (_, __) =>
            const MainScaffold(currentIndex: 3, child: EventsPage()),
      ),
      GoRoute(
        path: '${RouteNames.events}/:id',
        builder: (_, state) => EventDetailPage(
          eventId: int.tryParse(state.pathParameters['id'] ?? '') ?? 0,
        ),
      ),
      GoRoute(
        path: RouteNames.news,
        builder: (_, __) => const NewsListPage(),
      ),
      GoRoute(
        path: RouteNames.organizationIntroduction,
        builder: (_, __) => const OrganizationIntroductionPage(),
      ),
      GoRoute(
        path: RouteNames.network,
        builder: (_, __) => const NetworkPage(),
      ),
      GoRoute(
        path: RouteNames.mentorshipMyBookings,
        builder: (_, __) => const MyBookingsPage(),
      ),
      GoRoute(
        path: RouteNames.mentorshipSignup,
        builder: (_, __) => const MentorSignupPage(),
      ),
      GoRoute(
        path: RouteNames.mentorDashboard,
        builder: (_, __) => const MentorDashboardPage(),
      ),
      GoRoute(
        path: RouteNames.mentorAvailability,
        builder: (_, __) => const MentorAvailabilityPage(),
      ),
      GoRoute(
        path: RouteNames.mentorship,
        builder: (_, __) =>
            const MainScaffold(currentIndex: 2, child: MentorshipPage()),
      ),
      GoRoute(
        path: '${RouteNames.mentorship}/mentors/:id',
        builder: (_, state) => MentorProfilePage(
          memberId: int.tryParse(state.pathParameters['id'] ?? '') ?? 0,
        ),
      ),
      GoRoute(
        path: '${RouteNames.mentorship}/mentors/:id/book',
        builder: (_, state) => MentorBookingPage(
          memberId: int.tryParse(state.pathParameters['id'] ?? '') ?? 0,
        ),
      ),
      GoRoute(
        path: RouteNames.profile,
        // Profile is opened from the header avatar, not a bottom-nav tab, so it
        // highlights no tab (currentIndex: -1).
        builder: (_, __) =>
            const MainScaffold(currentIndex: -1, child: MyProfilePage()),
      ),
      GoRoute(
        path: RouteNames.profileEdit,
        builder: (_, __) => const MyProfileEditPage(),
      ),
      // ⚠️ Must be declared AFTER profileEdit so ':id' doesn't match 'edit'.
      GoRoute(
        path: '${RouteNames.profile}/:id',
        builder: (_, state) => PublicProfilePage(
          userId: int.tryParse(state.pathParameters['id'] ?? '') ?? 0,
        ),
      ),
      GoRoute(
        path: RouteNames.settings,
        builder: (_, __) => const SettingsPage(),
      ),
      GoRoute(
        path: RouteNames.notifications,
        builder: (_, __) => const NotificationsPage(),
      ),
      GoRoute(
        path: RouteNames.alumniVerification,
        builder: (_, __) => const AlumniVerificationPage(),
      ),
      GoRoute(
        path: RouteNames.savedArticles,
        builder: (_, __) => const SavedArticlesPage(),
      ),
      GoRoute(
        path: RouteNames.myTickets,
        builder: (_, __) => const MyTicketsPage(),
      ),
      // '/my-tickets/:code' — ticket detail. `extra` carries the EventTicket
      // when navigated from the list (fast path); otherwise it's fetched.
      GoRoute(
        path: '${RouteNames.myTickets}/:code',
        builder: (_, state) => TicketDetailPage(
          code: state.pathParameters['code'] ?? '',
          initial: state.extra is EventTicket
              ? state.extra as EventTicket
              : null,
        ),
      ),
      // Admin/staff event check-in. The auth gate keeps these behind login;
      // the picker page itself hides its content from non-staff roles.
      GoRoute(
        path: RouteNames.adminCheckIn,
        builder: (_, __) => const AdminCheckInEventsPage(),
      ),
      GoRoute(
        path: '${RouteNames.adminCheckIn}/:eventId',
        builder: (_, state) => EventCheckInScannerPage(
          eventId: int.tryParse(state.pathParameters['eventId'] ?? '') ?? 0,
          eventTitle: state.extra as String?,
        ),
      ),
      GoRoute(
        path: '/admin/events/:eventId',
        builder: (_, state) => AdminEventManagePage(
          eventId: int.tryParse(state.pathParameters['eventId'] ?? '') ?? 0,
        ),
      ),
      GoRoute(
        path: RouteNames.forum,
        builder: (_, __) =>
            const MainScaffold(currentIndex: 1, child: ForumCategoriesPage()),
      ),
      GoRoute(
        path: '${RouteNames.forum}/category/:id',
        builder: (_, state) => ForumTopicsPage(
          categoryId: int.tryParse(state.pathParameters['id'] ?? '') ?? 0,
          categoryName: state.extra as String?,
        ),
      ),
      GoRoute(
        path: '${RouteNames.forum}/category/:id/new',
        builder: (_, state) => ForumCreateTopicPage(
          categoryId: int.tryParse(state.pathParameters['id'] ?? '') ?? 0,
          categoryName: state.extra as String?,
        ),
      ),
      GoRoute(
        path: '${RouteNames.forum}/topic/:id',
        builder: (_, state) {
          final extra = state.extra;
          final topic = extra is ForumTopic ? extra : null;
          return ForumThreadPage(
            topicId: int.tryParse(state.pathParameters['id'] ?? '') ?? 0,
            topicTitle: topic?.title ?? (extra is String ? extra : null),
            initialTopic: topic,
          );
        },
      ),
      GoRoute(
        path: RouteNames.fundraising,
        builder: (_, __) => const FundraisingListPage(),
      ),
      GoRoute(
        path: RouteNames.fundraisingMyDonations,
        builder: (_, __) => const MyDonationsPage(),
      ),
      GoRoute(
        path: '${RouteNames.fundraising}/:id',
        builder: (_, state) => FundraisingDetailPage(
          fundId: int.tryParse(state.pathParameters['id'] ?? '') ?? 0,
        ),
      ),
      GoRoute(
        path: '${RouteNames.fundraising}/:id/donate',
        builder: (_, state) => FundraisingDonatePage(
          fundId: int.tryParse(state.pathParameters['id'] ?? '') ?? 0,
        ),
      ),
    ],
    errorBuilder: (_, state) => Scaffold(
      body: Center(child: Text('Route not found: ${state.matchedLocation}')),
    ),
  );
});

/// Bridges Riverpod auth/org state to a [Listenable] that GoRouter can watch
/// via `refreshListenable`. This re-runs `redirect` on changes WITHOUT
/// rebuilding the GoRouter (so pages aren't disposed mid-async).
class _RouterRefresh extends ChangeNotifier {
  _RouterRefresh(Ref ref) {
    _subs.add(ref.listen(authStateProvider, (_, __) => notifyListeners()));
    _subs.add(
        ref.listen(organizationStateProvider, (_, __) => notifyListeners()));
  }

  final List<ProviderSubscription> _subs = [];

  @override
  void dispose() {
    for (final s in _subs) {
      s.close();
    }
    super.dispose();
  }
}
