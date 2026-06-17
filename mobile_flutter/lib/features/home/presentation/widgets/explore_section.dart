import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/router/route_names.dart';
import '../../../../core/theme/app_colors.dart';
import 'section_title.dart';

class _ExploreItem {
  final IconData icon;
  final String title;
  final String description;
  final String route;
  const _ExploreItem(this.icon, this.title, this.description, this.route);
}

const _items = <_ExploreItem>[
  _ExploreItem(Icons.support_agent_rounded, 'Hỗ trợ & Tư vấn',
      'Giải đáp nhanh chóng và tư vấn cùng đội ngũ cựu sinh viên.',
      RouteNames.mentorship),
  _ExploreItem(Icons.groups_rounded, 'Kết nối cựu sinh viên',
      'Kết nối cộng đồng, chia sẻ kiến thức và kinh nghiệm.',
      RouteNames.network),
  _ExploreItem(Icons.person_search_rounded, 'Tìm kiếm cựu sinh viên',
      'Dễ dàng tìm kiếm và kết nối với cựu sinh viên.', RouteNames.network),
  _ExploreItem(Icons.event_available_rounded, 'Sự kiện & Hội thảo',
      'Tham gia sự kiện mở rộng quan hệ và cơ hội nghề nghiệp.',
      RouteNames.events),
  _ExploreItem(Icons.info_outline_rounded, 'Giới thiệu',
      'Tìm hiểu về tầm nhìn, sứ mệnh và hoạt động của tổ chức.',
      RouteNames.organizationIntroduction),
  _ExploreItem(Icons.forum_rounded, 'Diễn đàn',
      'Thảo luận, đặt câu hỏi và chia sẻ cùng cộng đồng.',
      RouteNames.forum),
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
        const SectionTitle('Khám phá'),
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
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: AppColors.divider),
            boxShadow: const [
              BoxShadow(
                  color: Color(0x14000000), blurRadius: 6, offset: Offset(0, 2)),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: AppColors.primary.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(item.icon, color: AppColors.primary, size: 26),
              ),
              const SizedBox(height: 12),
              Text(
                item.title,
                style: const TextStyle(
                  color: AppColors.primary,
                  fontWeight: FontWeight.bold,
                  fontSize: 15,
                ),
              ),
              const SizedBox(height: 6),
              Expanded(
                child: Text(
                  item.description,
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
