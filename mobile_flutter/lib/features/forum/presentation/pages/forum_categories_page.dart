import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/router/route_names.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../shared/widgets/empty_view.dart';
import '../../../../shared/widgets/error_view.dart';
import '../../../../shared/widgets/skeleton.dart';
import '../../data/models/forum_category.dart';
import '../providers/forum_providers.dart';

/// Forum home — list of categories (parent + nested sub-categories). Tapping a
/// sub-category opens its topic list. Native port of the web `ForumPage`.
class ForumCategoriesPage extends ConsumerWidget {
  const ForumCategoriesPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(forumCategoriesProvider);

    return Scaffold(
      appBar: AppBar(title: Text('forum.title'.tr())),
      body: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(forumCategoriesProvider);
          await ref.read(forumCategoriesProvider.future);
        },
        child: async.when(
          loading: () => ListView(
            children: List.generate(6, (_) => const SkeletonTile()),
          ),
          error: (_, __) => ErrorView(
            message: 'forum.load_failed'.tr(),
            onRetry: () => ref.invalidate(forumCategoriesProvider),
          ),
          data: (categories) {
            if (categories.isEmpty) {
              return EmptyView(
                icon: Icons.forum_outlined,
                title: 'forum.no_categories'.tr(),
                message: 'forum.no_categories_desc'.tr(),
              );
            }
            final parents = categories.where((c) => c.isParent).toList();
            final children = categories.where((c) => !c.isParent).toList();
            // Categories with no parent grouping still need to be reachable.
            final orphanParents = parents.isEmpty ? categories : parents;

            return ListView(
              padding: const EdgeInsets.all(16),
              children: [
                for (final parent in orphanParents) ...[
                  _ParentHeader(parent.name),
                  ...children
                      .where((c) => c.parentId == parent.id)
                      .map((c) => _CategoryTile(category: c)),
                  // If this "parent" is actually a leaf (no children), make it
                  // tappable itself.
                  if (children.every((c) => c.parentId != parent.id))
                    _CategoryTile(category: parent),
                  const SizedBox(height: 8),
                ],
              ],
            );
          },
        ),
      ),
    );
  }
}

class _ParentHeader extends StatelessWidget {
  const _ParentHeader(this.name);

  final String name;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(top: 8, bottom: 8),
      child: Text(
        name.toUpperCase(),
        style: const TextStyle(
          color: AppColors.primary,
          fontWeight: FontWeight.w900,
          fontSize: 16,
          letterSpacing: 0.25,
        ),
      ),
    );
  }
}

class _CategoryTile extends StatelessWidget {
  const _CategoryTile({required this.category});

  final ForumCategory category;

  @override
  Widget build(BuildContext context) {
    final hasStats =
        category.topicCount != null || category.participantCount != null;

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      color: AppColors.surface,
      elevation: 1.5,
      shadowColor: Colors.black.withValues(alpha: 0.12),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: const BorderSide(color: AppColors.divider),
      ),
      child: ListTile(
        contentPadding:
            const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        leading: Container(
          width: 42,
          height: 42,
          decoration: BoxDecoration(
            color: AppColors.primaryLighter,
            borderRadius: BorderRadius.circular(10),
          ),
          child: const Icon(Icons.forum_outlined, color: AppColors.primary),
        ),
        title: Text(category.name,
            style: const TextStyle(fontWeight: FontWeight.w900)),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (category.description != null &&
                category.description!.isNotEmpty)
              Text(category.description!,
                  maxLines: 2, overflow: TextOverflow.ellipsis),
            if (hasStats)
              Padding(
                padding: const EdgeInsets.only(top: 4),
                child: Row(
                  children: [
                    const Icon(Icons.forum_outlined,
                        size: 13, color: AppColors.textSecondary),
                    const SizedBox(width: 4),
                    Text(
                      'forum.posts_count'.tr(namedArgs: {
                        'count': '${category.topicCount ?? 0}',
                      }),
                      style: const TextStyle(
                          fontSize: 12, color: AppColors.textSecondary),
                    ),
                    const SizedBox(width: 12),
                    const Icon(Icons.people_outline,
                        size: 13, color: AppColors.textSecondary),
                    const SizedBox(width: 4),
                    Text(
                      'forum.members_count'.tr(namedArgs: {
                        'count': '${category.participantCount ?? 0}',
                      }),
                      style: const TextStyle(
                          fontSize: 12, color: AppColors.textSecondary),
                    ),
                  ],
                ),
              ),
          ],
        ),
        isThreeLine: hasStats,
        trailing: const Icon(Icons.chevron_right),
        onTap: () => context.push(
          '${RouteNames.forum}/category/${category.id}',
          extra: category.name,
        ),
      ),
    );
  }
}
