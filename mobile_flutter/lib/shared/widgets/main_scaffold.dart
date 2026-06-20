import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../core/router/route_names.dart';
import '../../core/theme/app_colors.dart';
import '../../features/fitbot/presentation/widgets/fitbot_fab.dart';

/// App shell with a persistent bottom navigation bar for the five primary
/// destinations. Each tab is a normal route; tapping a tab `go`s to it so the
/// back stack stays shallow. Detail screens (event/article/forum topic…) are
/// pushed full-screen on top and keep their own back button.
class MainScaffold extends StatelessWidget {
  const MainScaffold({
    super.key,
    required this.child,
    required this.currentIndex,
  });

  final Widget child;
  final int currentIndex;

  static const _tabs = <_TabSpec>[
    _TabSpec(RouteNames.home, Icons.home_outlined, Icons.home_rounded, 'Trang chủ'),
    _TabSpec(RouteNames.forum, Icons.forum_outlined, Icons.forum_rounded, 'Diễn đàn'),
    _TabSpec(RouteNames.mentorship, Icons.school_outlined, Icons.school_rounded, 'Cố vấn'),
    _TabSpec(RouteNames.events, Icons.event_outlined, Icons.event_rounded, 'Sự kiện'),
    _TabSpec(RouteNames.chat, Icons.chat_bubble_outline_rounded,
        Icons.chat_bubble_rounded, 'Tin nhắn'),
  ];

  /// Whether one of the bottom-nav tabs is the current screen. Screens opened
  /// outside the tab set (e.g. profile from the header) pass a negative index
  /// so no tab is highlighted.
  bool get _hasSelectedTab =>
      currentIndex >= 0 && currentIndex < _tabs.length;

  void _onTap(BuildContext context, int index) {
    if (index == currentIndex) return;
    context.go(_tabs[index].route);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: child,
      // FitBot assistant — the single floating launcher, bottom-right.
      floatingActionButton: const FitBotFab(),
      bottomNavigationBar: NavigationBarTheme(
        data: NavigationBarThemeData(
          backgroundColor: AppColors.surface,
          indicatorColor: AppColors.primary.withValues(alpha: 0.12),
          labelTextStyle: WidgetStateProperty.resolveWith((states) {
            final selected =
                _hasSelectedTab && states.contains(WidgetState.selected);
            return TextStyle(
              fontSize: 12,
              fontWeight: selected ? FontWeight.w600 : FontWeight.w500,
              color: selected ? AppColors.primary : AppColors.textSecondary,
            );
          }),
          iconTheme: WidgetStateProperty.resolveWith((states) {
            final selected =
                _hasSelectedTab && states.contains(WidgetState.selected);
            return IconThemeData(
              color: selected ? AppColors.primary : AppColors.textSecondary,
            );
          }),
        ),
        child: NavigationBar(
          height: 64,
          // NavigationBar requires a valid index; when no tab is current
          // (e.g. profile) fall back to 0 but suppress the highlight below.
          selectedIndex: _hasSelectedTab ? currentIndex : 0,
          indicatorColor: _hasSelectedTab
              ? AppColors.primary.withValues(alpha: 0.12)
              : Colors.transparent,
          onDestinationSelected: (i) => _onTap(context, i),
          labelBehavior: NavigationDestinationLabelBehavior.alwaysShow,
          destinations: [
            for (final t in _tabs)
              NavigationDestination(
                icon: Icon(t.icon),
                // When no tab is current, keep the outline icon even on the
                // fallback index 0 so nothing looks selected.
                selectedIcon: Icon(_hasSelectedTab ? t.activeIcon : t.icon),
                label: t.label,
              ),
          ],
        ),
      ),
    );
  }
}

class _TabSpec {
  final String route;
  final IconData icon;
  final IconData activeIcon;
  final String label;
  const _TabSpec(this.route, this.icon, this.activeIcon, this.label);
}
