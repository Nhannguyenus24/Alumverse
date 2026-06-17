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
import '../../features/home/presentation/pages/home_page.dart';
import '../../features/home/presentation/pages/splash_page.dart';
import '../../features/article/presentation/pages/article_detail_page.dart';
import '../../features/article/presentation/pages/news_list_page.dart';
import '../../features/event/presentation/pages/events_page.dart';
import '../../features/event/presentation/pages/event_detail_page.dart';
import '../../features/organization/presentation/pages/organization_introduction_page.dart';
import '../../features/user/presentation/pages/my_profile_page.dart';
import '../../features/user/presentation/pages/my_profile_edit_page.dart';
import '../../features/user/presentation/pages/settings_page.dart';
import '../../features/user/presentation/pages/notifications_page.dart';
import '../../features/forum/presentation/pages/forum_categories_page.dart';
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
import '../../shared/widgets/feature_placeholder_page.dart';
import 'route_names.dart';

final appRouterProvider = Provider<GoRouter>((ref) {
  final authState = ref.watch(authStateProvider);
  final orgState = ref.watch(organizationStateProvider);

  return GoRouter(
    initialLocation: RouteNames.splash,
    debugLogDiagnostics: true,
    redirect: (context, state) {
      final isSplash = state.matchedLocation == RouteNames.splash;

      // While auth/org are still resolving, stay on splash (avoids redirect
      // races and the "route not found" flash during startup).
      final isResolving = authState.isLoading || orgState.isLoading;
      if (isResolving) return isSplash ? null : RouteNames.splash;

      final isLoggedIn = authState.maybeWhen(
        data: (auth) => auth.isLoggedIn,
        orElse: () => false,
      );

      final hasOrg = orgState.maybeWhen(
        data: (org) => org != null,
        orElse: () => false,
      );

      final isOrgSelectRoute = state.matchedLocation == RouteNames.organizationSelect;
      // Public auth routes (signed-out only). Note: reset-password is the
      // "change password" flow and requires an active session — like the web,
      // it lives behind the auth gate, NOT here.
      final isAuthRoute = state.matchedLocation == RouteNames.login ||
          state.matchedLocation == RouteNames.register ||
          state.matchedLocation == RouteNames.forgotPassword ||
          state.matchedLocation == RouteNames.signupCode ||
          state.matchedLocation == RouteNames.organizationRegistration;
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
        builder: (_, __) => const HomePage(),
      ),
      GoRoute(
        path: RouteNames.chat,
        builder: (_, __) => const ChatListPage(),
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
        builder: (_, __) => const EventsPage(),
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
        builder: (_, __) => const FeaturePlaceholderPage(
          title: 'Kết nối cựu sinh viên',
          icon: Icons.groups_rounded,
        ),
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
        builder: (_, __) => const MentorshipPage(),
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
        builder: (_, __) => const MyProfilePage(),
      ),
      GoRoute(
        path: RouteNames.profileEdit,
        builder: (_, __) => const MyProfileEditPage(),
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
        path: RouteNames.forum,
        builder: (_, __) => const ForumCategoriesPage(),
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
        builder: (_, state) => ForumThreadPage(
          topicId: int.tryParse(state.pathParameters['id'] ?? '') ?? 0,
          topicTitle: state.extra as String?,
        ),
      ),
      GoRoute(
        path: RouteNames.fundraising,
        builder: (_, __) => const FeaturePlaceholderPage(
          title: 'Đóng góp & Quỹ',
          icon: Icons.volunteer_activism_rounded,
        ),
      ),
    ],
    errorBuilder: (_, state) => Scaffold(
      body: Center(child: Text('Route not found: ${state.matchedLocation}')),
    ),
  );
});
