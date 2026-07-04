import 'dart:async';

import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/router/route_names.dart';
import '../../../../core/theme/app_colors.dart';

/// Hero banner — a 2-page auto-sliding carousel:
///  • page 1: the Alumverse intro hero (brand + tagline + org chip)
///  • page 2: the organisation "Giới thiệu" slide (taps through to the intro)
///
/// Auto-advances every 10s; the dots at the bottom-centre jump to a page.
class HeroBanner extends StatefulWidget {
  const HeroBanner({super.key, this.organizationName});

  final String? organizationName;

  @override
  State<HeroBanner> createState() => _HeroBannerState();
}

class _HeroBannerState extends State<HeroBanner> {
  final _controller = PageController();
  Timer? _timer;
  int _page = 0;

  static const _autoSlide = Duration(seconds: 10);
  static const _pageCount = 2;

  @override
  void initState() {
    super.initState();
    _startTimer();
  }

  void _startTimer() {
    _timer?.cancel();
    _timer = Timer.periodic(_autoSlide, (_) {
      if (!mounted || !_controller.hasClients) return;
      final next = (_page + 1) % _pageCount;
      _controller.animateToPage(
        next,
        duration: const Duration(milliseconds: 450),
        curve: Curves.easeInOut,
      );
    });
  }

  void _goTo(int index) {
    _controller.animateToPage(
      index,
      duration: const Duration(milliseconds: 350),
      curve: Curves.easeInOut,
    );
    _startTimer(); // reset the auto-slide countdown after a manual tap
  }

  @override
  void dispose() {
    _timer?.cancel();
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [AppColors.primaryDark, AppColors.primary],
        ),
      ),
      child: Stack(
        children: [
          // Fixed height so the carousel doesn't jump between pages.
          SizedBox(
            height: 248,
            child: PageView(
              controller: _controller,
              onPageChanged: (i) => setState(() => _page = i),
              children: [
                _AlumverseSlide(organizationName: widget.organizationName),
                _IntroSlide(
                  organizationName: widget.organizationName,
                  onTap:
                      () => context.push(RouteNames.organizationIntroduction),
                ),
              ],
            ),
          ),
          // Dots indicator — bottom centre.
          Positioned(
            bottom: 10,
            left: 0,
            right: 0,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: List.generate(_pageCount, (i) {
                final active = i == _page;
                return GestureDetector(
                  onTap: () => _goTo(i),
                  behavior: HitTestBehavior.opaque,
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 250),
                    margin: const EdgeInsets.symmetric(horizontal: 4),
                    width: active ? 22 : 8,
                    height: 8,
                    decoration: BoxDecoration(
                      color:
                          active
                              ? Colors.white
                              : Colors.white.withValues(alpha: 0.45),
                      borderRadius: BorderRadius.circular(4),
                    ),
                  ),
                );
              }),
            ),
          ),
        ],
      ),
    );
  }
}

/// Page 1 — the Alumverse brand hero (the previous banner content).
class _AlumverseSlide extends StatelessWidget {
  const _AlumverseSlide({this.organizationName});

  final String? organizationName;

  @override
  Widget build(BuildContext context) {
    return _SlideScroll(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Icon(Icons.school_rounded, color: Colors.white, size: 40),
          const SizedBox(height: 10),
          const Text(
            'ALUMVERSE',
            style: TextStyle(
              color: Colors.white,
              fontSize: 26,
              fontWeight: FontWeight.w800,
              letterSpacing: 2,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'home.hero_tagline'.tr(),
            style: const TextStyle(
              color: Colors.white70,
              height: 1.5,
              fontSize: 14,
            ),
          ),
          if (organizationName != null) ...[
            const SizedBox(height: 14),
            _OrgChip(organizationName!),
          ],
        ],
      ),
    );
  }
}

/// Wraps a slide's content so it vertically centres when it fits, but becomes
/// scrollable instead of overflowing when it's taller than the banner (e.g.
/// large text scale or long org names).
class _SlideScroll extends StatelessWidget {
  const _SlideScroll({required this.child});
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        return SingleChildScrollView(
          child: ConstrainedBox(
            constraints: BoxConstraints(minHeight: constraints.maxHeight),
            child: Padding(
              padding: const EdgeInsets.fromLTRB(20, 24, 20, 36),
              child: child,
            ),
          ),
        );
      },
    );
  }
}

/// Page 2 — the organisation "Giới thiệu" slide.
class _IntroSlide extends StatelessWidget {
  const _IntroSlide({required this.onTap, this.organizationName});

  final VoidCallback onTap;
  final String? organizationName;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      child: _SlideScroll(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Icon(
              Icons.info_outline_rounded,
              color: Colors.white,
              size: 40,
            ),
            const SizedBox(height: 10),
            Text(
              organizationName != null
                  ? 'home.intro_title_with_org'.tr(
                    namedArgs: {'name': organizationName!},
                  )
                  : 'organization.introduction'.tr(),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 22,
                fontWeight: FontWeight.w800,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'home.intro_subtitle'.tr(),
              style: const TextStyle(
                color: Colors.white70,
                height: 1.5,
                fontSize: 14,
              ),
            ),
            const SizedBox(height: 14),
            Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 14,
                    vertical: 7,
                  ),
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.18),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        'home.view_intro'.tr(),
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      const SizedBox(width: 4),
                      const Icon(
                        Icons.arrow_forward_rounded,
                        color: Colors.white,
                        size: 16,
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _OrgChip extends StatelessWidget {
  const _OrgChip(this.name);
  final String name;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(Icons.apartment_rounded, color: Colors.white, size: 16),
          const SizedBox(width: 6),
          Flexible(
            child: Text(
              name,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 13,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
