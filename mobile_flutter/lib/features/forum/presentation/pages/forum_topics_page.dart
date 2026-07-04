import 'package:cached_network_image/cached_network_image.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/router/route_names.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/utils/image_url.dart';
import '../../../../core/utils/relative_time.dart';
import '../../../../shared/widgets/empty_view.dart';
import '../../../../shared/widgets/error_view.dart';
import '../../../../shared/widgets/skeleton.dart';
import '../../../user/presentation/providers/user_providers.dart';
import '../../data/models/forum_topic.dart';
import '../providers/forum_providers.dart';

/// Topic/thread list for a category. Native port of the web `ForumCategoryPage`.
/// FAB opens the create-topic screen.
class ForumTopicsPage extends ConsumerWidget {
  const ForumTopicsPage({
    super.key,
    required this.categoryId,
    this.categoryName,
  });

  final int categoryId;
  final String? categoryName;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(forumTopicsProvider(categoryId));

    return Scaffold(
      appBar: AppBar(title: Text(categoryName ?? 'forum.categories'.tr())),
      floatingActionButton: FloatingActionButton.extended(
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
        onPressed: () async {
          await context.push(
            '${RouteNames.forum}/category/$categoryId/new',
            extra: categoryName,
          );
          ref.invalidate(forumTopicsProvider(categoryId));
        },
        icon: const Icon(Icons.add),
        label: Text('forum.create_topic_short'.tr()),
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(forumTopicsProvider(categoryId));
          await ref.read(forumTopicsProvider(categoryId).future);
        },
        child: async.when(
          loading: () => ListView(
            children: List.generate(6, (_) => const SkeletonTile()),
          ),
          error: (_, __) => ErrorView(
            message: 'forum.load_topics_failed'.tr(),
            onRetry: () => ref.invalidate(forumTopicsProvider(categoryId)),
          ),
          data: (topics) {
            if (topics.isEmpty) {
              return EmptyView(
                icon: Icons.chat_bubble_outline,
                title: 'forum.no_topics'.tr(),
                message: 'forum.no_topics_desc'.tr(),
              );
            }
            return ListView.builder(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 88),
              itemCount: topics.length,
              itemBuilder: (_, i) => _TopicTile(topic: topics[i]),
            );
          },
        ),
      ),
    );
  }
}

class _TopicTile extends StatelessWidget {
  const _TopicTile({required this.topic});

  final ForumTopic topic;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Material(
        color: AppColors.surface,
        elevation: 1.5,
        shadowColor: const Color(0x18000000),
        borderRadius: BorderRadius.circular(12),
        child: InkWell(
          borderRadius: BorderRadius.circular(12),
          onTap: () => context.push(
            '${RouteNames.forum}/topic/${topic.id}',
            extra: topic,
          ),
          child: Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: AppColors.divider),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  topic.title,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    fontWeight: FontWeight.w800,
                    fontSize: 16,
                    color: AppColors.textPrimary,
                  ),
                ),
                const SizedBox(height: 12),
                Row(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Expanded(
                      child: _AuthorChip(
                        memberId: topic.createdByMemberId,
                        authorName: topic.authorName,
                        avatarUrl: topic.authorAvatarUrl,
                        createdAt: topic.createdAt,
                      ),
                    ),
                    const SizedBox(width: 12),
                    _StatsCluster(
                      views: topic.viewCount,
                      replies: topic.replyCount,
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _StatsCluster extends StatelessWidget {
  const _StatsCluster({required this.views, required this.replies});

  final int views;
  final int replies;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        _StatPill(
          icon: Icons.visibility_outlined,
          value: views,
        ),
        const SizedBox(width: 6),
        _StatPill(
          icon: Icons.chat_bubble_outline,
          value: replies,
        ),
      ],
    );
  }
}

class _StatPill extends StatelessWidget {
  const _StatPill({
    required this.icon,
    required this.value,
  });

  final IconData icon;
  final int value;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 15, color: AppColors.primary),
        const SizedBox(width: 4),
        Text(
          '$value',
          style: const TextStyle(
            color: AppColors.primary,
            fontWeight: FontWeight.w800,
            fontSize: 13,
            height: 1,
          ),
        ),
      ],
    );
  }
}

class _AuthorChip extends ConsumerWidget {
  const _AuthorChip({
    required this.memberId,
    required this.authorName,
    required this.avatarUrl,
    required this.createdAt,
  });

  final int? memberId;
  final String? authorName;
  final String? avatarUrl;
  final DateTime? createdAt;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final profile = memberId == null
        ? null
        : ref.watch(publicProfileProvider(memberId!)).valueOrNull;
    final displayName = _firstNonEmpty([
      authorName,
      profile?.fullName,
      memberId != null
          ? 'forum.member_id'.tr(namedArgs: {'id': memberId.toString()})
          : null,
    ]);
    final resolvedAvatar = resolveImageUrl(avatarUrl ?? profile?.avatarUrl);
    final createdLabel = formatRelativeTimeVi(createdAt);

    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        CircleAvatar(
          radius: 16,
          backgroundColor: AppColors.primaryLighter,
          backgroundImage: resolvedAvatar != null
              ? CachedNetworkImageProvider(resolvedAvatar)
              : null,
          child: resolvedAvatar == null
              ? Text(
                  displayName.characters.first.toUpperCase(),
                  style: const TextStyle(
                    color: AppColors.primary,
                    fontWeight: FontWeight.bold,
                  ),
                )
              : null,
        ),
        const SizedBox(width: 8),
        Flexible(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                displayName,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style:
                    const TextStyle(fontWeight: FontWeight.w700, fontSize: 13),
              ),
              if (createdLabel.isNotEmpty)
                Text(
                  createdLabel,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    fontSize: 11,
                    color: AppColors.textSecondary,
                  ),
                ),
            ],
          ),
        ),
      ],
    );
  }

  String _firstNonEmpty(List<String?> values) {
    for (final value in values) {
      final trimmed = value?.trim();
      if (trimmed?.isNotEmpty == true) return trimmed!;
    }
    return 'forum.member'.tr();
  }
}
