import 'package:cached_network_image/cached_network_image.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/utils/image_url.dart';
import '../../data/models/mentor_profile.dart';

/// Mentor card mirroring the web `MentorshipCard`: avatar, name, role, rating,
/// expertise tags, and Profile / Book actions.
class MentorCard extends StatelessWidget {
  const MentorCard({
    super.key,
    required this.mentor,
    required this.onViewProfile,
    required this.onBook,
  });

  final MentorProfile mentor;
  final VoidCallback onViewProfile;
  final VoidCallback onBook;

  @override
  Widget build(BuildContext context) {
    final avatar = resolveImageUrl(mentor.avatarUrl);
    final rating =
        mentor.ratingAvg != null ? mentor.ratingAvg!.toStringAsFixed(1) : '0.0';
    final tags = mentor.expertiseTopics.take(3).toList();

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.divider),
      ),
      child: Column(
        children: [
          CircleAvatar(
            radius: 40,
            backgroundColor: AppColors.primary.withValues(alpha: 0.1),
            backgroundImage:
                avatar != null ? CachedNetworkImageProvider(avatar) : null,
            child:
                avatar == null
                    ? const Icon(
                      Icons.person,
                      size: 44,
                      color: AppColors.primary,
                    )
                    : null,
          ),
          const SizedBox(height: 12),
          Text(
            mentor.displayName,
            textAlign: TextAlign.center,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
          ),
          const SizedBox(height: 2),
          Text(
            mentor.roleLine,
            textAlign: TextAlign.center,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(
              color: AppColors.textSecondary,
              fontSize: 13,
            ),
          ),
          const SizedBox(height: 8),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.star, color: AppColors.secondary, size: 18),
              const SizedBox(width: 4),
              Text(
                rating,
                style: const TextStyle(
                  fontWeight: FontWeight.bold,
                  color: AppColors.primary,
                ),
              ),
              const SizedBox(width: 4),
              Text(
                'mentorship.sessions_count'.tr(
                  namedArgs: {'count': mentor.totalSessions.toString()},
                ),
                style: const TextStyle(
                  color: AppColors.textSecondary,
                  fontSize: 13,
                ),
              ),
            ],
          ),
          if (tags.isNotEmpty) ...[
            const SizedBox(height: 12),
            Wrap(
              alignment: WrapAlignment.center,
              spacing: 6,
              runSpacing: 6,
              children:
                  tags
                      .map(
                        (t) => Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 10,
                            vertical: 4,
                          ),
                          decoration: BoxDecoration(
                            color: AppColors.primary.withValues(alpha: 0.08),
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Text(
                            t,
                            style: const TextStyle(
                              fontSize: 11.5,
                              color: AppColors.primary,
                            ),
                          ),
                        ),
                      )
                      .toList(),
            ),
          ],
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                flex: 3,
                child: OutlinedButton(
                  onPressed: onViewProfile,
                  child: Text('mentorship.view_profile'.tr()),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                flex: 2,
                child: ElevatedButton(
                  onPressed: onBook,
                  child: Text('mentorship.book_session'.tr()),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
