import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/router/route_names.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/utils/relative_time.dart';
import '../../../../shared/widgets/empty_view.dart';
import '../../../../shared/widgets/error_view.dart';
import '../../../../shared/widgets/skeleton.dart';
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
            return ListView.separated(
              padding: const EdgeInsets.fromLTRB(0, 8, 0, 88),
              itemCount: topics.length,
              separatorBuilder: (_, __) => const Divider(height: 1),
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
    return InkWell(
      onTap: () => context.push(
        '${RouteNames.forum}/topic/${topic.id}',
        extra: topic.title,
      ),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              topic.title,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 16),
            ),
            const SizedBox(height: 2),
            Text(
              '${'forum.created_at'.tr()} · ${formatRelativeTimeVi(topic.createdAt)}',
              style: const TextStyle(
                  fontSize: 12, color: AppColors.textSecondary),
            ),
            const SizedBox(height: 10),
            Row(
              children: [
                _Stat(
                    label: 'forum.topic_views'.tr(),
                    value: topic.viewCount),
                const SizedBox(width: 24),
                _Stat(
                    label: 'forum.topic_replies'.tr(),
                    value: topic.replyCount),
                const Spacer(),
                _AuthorChip(
                  memberId: topic.createdByMemberId,
                  updatedAt: topic.updatedAt ?? topic.createdAt,
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _Stat extends StatelessWidget {
  const _Stat({required this.label, required this.value});

  final String label;
  final int value;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        Text(label,
            style: const TextStyle(
                fontSize: 11, color: AppColors.textSecondary)),
        const SizedBox(height: 2),
        Text('$value',
            style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 14)),
      ],
    );
  }
}

class _AuthorChip extends StatelessWidget {
  const _AuthorChip({required this.memberId, required this.updatedAt});

  final int? memberId;
  final DateTime? updatedAt;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        const CircleAvatar(
          radius: 16,
          backgroundColor: AppColors.primary,
          child: Icon(Icons.person, size: 18, color: Colors.white),
        ),
        const SizedBox(width: 8),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'forum.member_id'.tr(
                  namedArgs: {'id': '${memberId ?? '—'}'}),
              style: const TextStyle(
                  fontWeight: FontWeight.w600, fontSize: 13),
            ),
            Text(formatRelativeTimeVi(updatedAt),
                style: const TextStyle(
                    fontSize: 11, color: AppColors.textSecondary)),
          ],
        ),
      ],
    );
  }
}
