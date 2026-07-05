import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/router/route_names.dart';
import '../../../../core/theme/app_colors.dart';
import 'section_title.dart';

class _ExploreItem {
  final IconData icon;
  final String titleKey;
  final String descKey;
  final String route;
  const _ExploreItem(this.icon, this.titleKey, this.descKey, this.route);
}

const _items = <_ExploreItem>[
  _ExploreItem(
    Icons.newspaper_rounded,
    'home.explore_news_title',
    'home.explore_news_desc',
    RouteNames.news,
  ),
  _ExploreItem(
    Icons.support_agent_rounded,
    'home.explore_mentorship_title',
    'home.explore_mentorship_desc',
    RouteNames.mentorship,
  ),
  _ExploreItem(
    Icons.groups_rounded,
    'home.explore_network_title',
    'home.explore_network_desc',
    RouteNames.network,
  ),
  _ExploreItem(
    Icons.event_available_rounded,
    'home.explore_events_title',
    'home.explore_events_desc',
    RouteNames.events,
  ),
  _ExploreItem(
    Icons.forum_rounded,
    'home.explore_forum_title',
    'home.explore_forum_desc',
    RouteNames.forum,
  ),
  _ExploreItem(
    Icons.volunteer_activism_rounded,
    'home.explore_donation_title',
    'home.explore_donation_desc',
    RouteNames.fundraising,
  ),
];

/// "Khám phá" — 2-column grid of feature cards (web shows 4 across on desktop,
/// stacked on mobile; a 2-up grid reads best on a phone).
class ExploreSection extends StatelessWidget {
  const ExploreSection({super.key});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SectionTitle('home.explore'.tr()),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: GridView.count(
            crossAxisCount: 2,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            mainAxisSpacing: 12,
            crossAxisSpacing: 12,
            childAspectRatio: 0.95,
            children: _items.map((e) => _ExploreCard(item: e)).toList(),
          ),
        ),
      ],
    );
  }
}

class _ExploreCard extends StatelessWidget {
  const _ExploreCard({required this.item});

  final _ExploreItem item;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: AppColors.surface,
      borderRadius: BorderRadius.circular(12),
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: () => context.push(item.route),
        child: Ink(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: AppColors.surface,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: AppColors.divider),
            boxShadow: const [
              BoxShadow(
                color: Color(0x12000000),
                blurRadius: 8,
                offset: Offset(0, 2),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: AppColors.primaryLighter,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(item.icon, color: AppColors.primary, size: 26),
              ),
              const SizedBox(height: 12),
              Text(
                item.titleKey.tr(),
                style: const TextStyle(
                  color: AppColors.primary,
                  fontWeight: FontWeight.w900,
                  fontSize: 15,
                ),
              ),
              const SizedBox(height: 6),
              Expanded(
                child: Text(
                  item.descKey.tr(),
                  style: const TextStyle(
                    color: AppColors.textSecondary,
                    fontSize: 12.5,
                    height: 1.4,
                  ),
                  maxLines: 4,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
