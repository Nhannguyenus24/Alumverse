import 'package:cached_network_image/cached_network_image.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/router/route_names.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/utils/image_url.dart';
import '../../../network/data/models/network_member.dart';
import '../../../network/presentation/providers/network_provider.dart';
import 'section_title.dart';

/// "Cộng đồng cựu sinh viên" — real organization members from
/// `/api/chat/network/members`. Horizontally scrollable.
class CommunitySection extends ConsumerWidget {
  const CommunitySection({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(featuredMembersProvider);

    return async.when(
      loading: () => const SizedBox.shrink(),
      error: (_, __) => const SizedBox.shrink(),
      data: (members) {
        if (members.isEmpty) return const SizedBox.shrink();
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            SectionTitle('home.community_title'.tr()),
            SizedBox(
              height: 168,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 16),
                itemCount: members.length,
                separatorBuilder: (_, __) => const SizedBox(width: 12),
                itemBuilder: (_, i) => _MemberCard(member: members[i]),
              ),
            ),
          ],
        );
      },
    );
  }
}

class _MemberCard extends StatelessWidget {
  const _MemberCard({required this.member});

  final NetworkMember member;

  @override
  Widget build(BuildContext context) {
    final avatar = resolveImageUrl(member.avatarUrl);
    return InkWell(
      borderRadius: BorderRadius.circular(12),
      onTap: () => context.push('${RouteNames.profile}/${member.userId}'),
      child: Container(
        width: 150,
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppColors.divider),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            CircleAvatar(
              radius: 32,
              backgroundColor: AppColors.primaryLighter,
              backgroundImage:
                  avatar != null ? CachedNetworkImageProvider(avatar) : null,
              child: avatar == null
                  ? const Icon(Icons.person, size: 36, color: AppColors.primary)
                  : null,
            ),
            const SizedBox(height: 10),
            Text(
              member.fullName,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 14),
            ),
            if (member.subtitle.isNotEmpty) ...[
              const SizedBox(height: 2),
              Text(
                member.subtitle,
                maxLines: 2,
                textAlign: TextAlign.center,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                  color: AppColors.textSecondary,
                  fontSize: 11.5,
                  height: 1.3,
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
