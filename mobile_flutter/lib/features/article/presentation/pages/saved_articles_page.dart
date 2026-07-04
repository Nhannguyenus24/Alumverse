import 'package:cached_network_image/cached_network_image.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/router/route_names.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/utils/image_url.dart';
import '../../../../shared/widgets/empty_view.dart';
import '../../../../shared/widgets/error_view.dart';
import '../../../../shared/widgets/skeleton.dart';
import '../../data/models/saved_item.dart';
import '../../data/repositories/article_repository.dart';
import '../providers/news_provider.dart';

/// "Bài viết đã lưu" — the current user's saved articles. Each saved item
/// stores only an article reference, so the title/thumbnail is resolved per
/// item via the news-detail provider. Reached from the header avatar menu.
class SavedArticlesPage extends ConsumerWidget {
  const SavedArticlesPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      appBar: AppBar(title: Text('article.saved'.tr())),
      body: Consumer(
        builder: (context, ref, _) {
          final async = ref.watch(savedArticlesProvider);
          return async.when(
            loading:
                () => ListView(
                  children: List.generate(5, (_) => const SkeletonTile()),
                ),
            error:
                (_, __) => ErrorView(
                  message: 'article.saved_load_failed'.tr(),
                  onRetry: () => ref.invalidate(savedArticlesProvider),
                ),
            data: (items) {
              if (items.isEmpty) {
                return EmptyView(
                  icon: Icons.favorite_border_rounded,
                  title: 'article.no_saved'.tr(),
                  message: 'article.no_saved_desc'.tr(),
                );
              }
              return RefreshIndicator(
                onRefresh: () async {
                  ref.invalidate(savedArticlesProvider);
                  await ref.read(savedArticlesProvider.future);
                },
                child: ListView.separated(
                  padding: const EdgeInsets.all(12),
                  itemCount: items.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 10),
                  itemBuilder: (_, i) => _SavedCard(item: items[i]),
                ),
              );
            },
          );
        },
      ),
    );
  }
}

class _SavedCard extends ConsumerWidget {
  const _SavedCard({required this.item});
  final SavedItem item;

  Future<void> _unsave(WidgetRef ref) async {
    try {
      await ref.read(articleRepositoryProvider).unsave(item.itemId);
    } catch (_) {}
    ref.invalidate(savedArticlesProvider);
    ref.invalidate(isArticleSavedProvider(item.itemId));
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final articleAsync = ref.watch(newsDetailProvider(item.itemId));
    final article = articleAsync.valueOrNull;
    final title =
        article?.title ??
        'article.article_id'.tr(namedArgs: {'id': item.itemId.toString()});
    final thumb = resolveImageUrl(article?.thumbnailUrl);

    return InkWell(
      borderRadius: BorderRadius.circular(12),
      onTap: () => context.push('${RouteNames.articles}/${item.itemId}'),
      child: Container(
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppColors.divider),
        ),
        clipBehavior: Clip.antiAlias,
        child: Row(
          children: [
            SizedBox(
              width: 96,
              height: 84,
              child:
                  thumb != null
                      ? CachedNetworkImage(
                        imageUrl: thumb,
                        fit: BoxFit.cover,
                        placeholder:
                            (_, __) => Container(color: AppColors.divider),
                        errorWidget: (_, __, ___) => _placeholder(),
                      )
                      : _placeholder(),
            ),
            Expanded(
              child: Padding(
                padding: const EdgeInsets.symmetric(
                  horizontal: 12,
                  vertical: 10,
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    if (articleAsync.isLoading)
                      const SkeletonBox(height: 14, width: 160)
                    else
                      Text(
                        title,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          fontWeight: FontWeight.w700,
                          fontSize: 14.5,
                        ),
                      ),
                    if (article?.topic != null &&
                        article!.topic!.isNotEmpty) ...[
                      const SizedBox(height: 4),
                      Text(
                        article.topic!.toUpperCase(),
                        style: const TextStyle(
                          fontSize: 11,
                          color: AppColors.primary,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ),
            IconButton(
              tooltip: 'article.unsave'.tr(),
              onPressed: () => _unsave(ref),
              icon: const Icon(Icons.favorite, color: AppColors.error),
            ),
          ],
        ),
      ),
    );
  }

  Widget _placeholder() => Container(
    color: AppColors.primary.withValues(alpha: 0.08),
    child: const Icon(Icons.article_outlined, color: AppColors.primary),
  );
}
