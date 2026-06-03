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
import 'route_names.dart';

final appRouterProvider = Provider<GoRouter>((ref) {
  final authState = ref.watch(authStateProvider);
  final orgState = ref.watch(organizationStateProvider);

  return GoRouter(
    initialLocation: RouteNames.splash,
    debugLogDiagnostics: true,
    redirect: (context, state) {
      final isLoggedIn = authState.maybeWhen(
        data: (user) => user != null,
        orElse: () => false,
      );

      final hasOrg = orgState.maybeWhen(
        data: (org) => org != null,
        orElse: () => false,
      );

      final isOrgSelectRoute = state.matchedLocation == RouteNames.organizationSelect;
      final isAuthRoute = state.matchedLocation == RouteNames.login ||
          state.matchedLocation == RouteNames.register ||
          state.matchedLocation == RouteNames.forgotPassword ||
          state.matchedLocation == RouteNames.signupCode ||
          state.matchedLocation == RouteNames.resetPassword ||
          state.matchedLocation == RouteNames.organizationRegistration;
      final isSplash = state.matchedLocation == RouteNames.splash;

      if (isSplash) return null;

      // 1. If no organization selected, must go to organization select
      if (!hasOrg && !isOrgSelectRoute) return RouteNames.organizationSelect;
      
      // 2. If has organization but at org select, go to login (if not logged in) or home
      if (hasOrg && isOrgSelectRoute) return isLoggedIn ? RouteNames.home : RouteNames.login;

      // 3. Normal auth check
      if (!isLoggedIn && !isAuthRoute) return RouteNames.login;
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
    ],
    errorBuilder: (_, state) => Scaffold(
      body: Center(child: Text('Route not found: ${state.matchedLocation}')),
    ),
  );
});
