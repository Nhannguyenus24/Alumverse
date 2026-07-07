import 'package:cached_network_image/cached_network_image.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/router/route_names.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/utils/html_utils.dart';
import '../../../../core/utils/image_url.dart';
import '../../../../shared/widgets/empty_view.dart';
import '../../../../shared/widgets/error_view.dart';
import '../../../../shared/widgets/skeleton.dart';
import '../../data/models/article.dart';
import '../providers/news_provider.dart';

class HonorsListPage extends ConsumerWidget {
  const HonorsListPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(honorsArticlesProvider);

    return Scaffold(
      appBar: AppBar(title: Text('article.honors_title'.tr())),
      body: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(honorsArticlesProvider);
          await ref.read(honorsArticlesProvider.future);
        },
        child: async.when(
          loading: () => const SkeletonList(count: 4),
          error:
              (_, __) => ErrorView(
                message: 'article.honors_load_failed'.tr(),
                onRetry: () => ref.invalidate(honorsArticlesProvider),
              ),
          data: (articles) {
            if (articles.isEmpty) {
              return EmptyView(
                icon: Icons.emoji_events_outlined,
                title: 'article.no_honors'.tr(),
                message: 'article.no_honors_desc'.tr(),
              );
            }
            final featured = articles.first;
            final rest =
                articles.length > 1 ? articles.sublist(1) : <Article>[];

            return CustomScrollView(
              slivers: [
                SliverPadding(
                  padding: const EdgeInsets.all(16),
                  sliver: SliverList(
                    delegate: SliverChildListDelegate([
                      Text(
                        'article.honors_title_upper'.tr(),
                        style: Theme.of(
                          context,
                        ).textTheme.headlineSmall?.copyWith(
                          fontWeight: FontWeight.w800,
                          color: AppColors.primary,
                        ),
                      ),
                      const SizedBox(height: 16),
                      _FeaturedHonorCard(article: featured)
                          .animate()
                          .fadeIn(duration: 300.ms)
                          .slideY(begin: 0.08, curve: Curves.easeOut),
                    ]),
                  ),
                ),
                if (rest.isNotEmpty) ...[
                  SliverPadding(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    sliver: SliverToBoxAdapter(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const SizedBox(height: 24),
                          Text(
                            'article.suggestions'.tr(),
                            style: const TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                          const SizedBox(height: 12),
                        ],
                      ),
                    ),
                  ),
                  SliverPadding(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    sliver: SliverGrid(
                      gridDelegate:
                          const SliverGridDelegateWithFixedCrossAxisCount(
                            crossAxisCount: 2,
                            mainAxisSpacing: 12,
                            crossAxisSpacing: 12,
                            childAspectRatio: 0.58,
                          ),
                      delegate: SliverChildBuilderDelegate(
                        (_, i) => _HonorCard(article: rest[i])
                            .animate()
                            .fadeIn(duration: 300.ms, delay: (40 * i).ms)
                            .slideY(begin: 0.1, curve: Curves.easeOut),
                        childCount: rest.length,
                      ),
                    ),
                  ),
                ],
                const SliverToBoxAdapter(child: SizedBox(height: 24)),
              ],
            );
          },
        ),
      ),
    );
  }
}

class _FeaturedHonorCard extends StatelessWidget {
  const _FeaturedHonorCard({required this.article});

  final Article article;

  @override
  Widget build(BuildContext context) {
    final thumb = resolveImageUrl(article.thumbnailUrl);
    final snippet = HtmlUtils.toPlainText(article.content);
    final date =
        article.publishedAt != null
            ? DateFormat('dd/MM/yyyy').format(article.publishedAt!)
            : null;

    return InkWell(
      onTap: () => context.push(_articlePath(article)),
      borderRadius: BorderRadius.circular(14),
      child: Container(
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: AppColors.divider),
        ),
        clipBehavior: Clip.antiAlias,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            AspectRatio(
              aspectRatio: 16 / 9,
              child:
                  thumb != null
                      ? CachedNetworkImage(
                        imageUrl: thumb,
                        fit: BoxFit.cover,
                        placeholder:
                            (_, __) => Container(color: AppColors.divider),
                        errorWidget: (_, __, ___) => const _HonorFallback(),
                      )
                      : const _HonorFallback(),
            ),
            Padding(
              padding: const EdgeInsets.all(14),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _ChannelLabel(article: article),
                  const SizedBox(height: 4),
                  Text(
                    article.title,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  if (snippet.isNotEmpty) ...[
                    const SizedBox(height: 6),
                    Text(
                      snippet,
                      maxLines: 3,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        color: AppColors.textSecondary,
                        fontSize: 13.5,
                        height: 1.4,
                      ),
                    ),
                  ],
                  if (date != null) ...[
                    const SizedBox(height: 8),
                    _DateLine(date: date),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _HonorCard extends StatelessWidget {
  const _HonorCard({required this.article});

  final Article article;

  @override
  Widget build(BuildContext context) {
    final thumb = resolveImageUrl(article.thumbnailUrl);
    final snippet = HtmlUtils.toPlainText(article.content);
    final date =
        article.publishedAt != null
            ? DateFormat('dd/MM/yyyy').format(article.publishedAt!)
            : null;

    return InkWell(
      onTap: () => context.push(_articlePath(article)),
      borderRadius: BorderRadius.circular(12),
      child: Container(
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppColors.divider),
        ),
        clipBehavior: Clip.antiAlias,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            AspectRatio(
              aspectRatio: 16 / 10,
              child:
                  thumb != null
                      ? CachedNetworkImage(
                        imageUrl: thumb,
                        fit: BoxFit.cover,
                        placeholder:
                            (_, __) => Container(color: AppColors.divider),
                        errorWidget: (_, __, ___) => const _HonorFallback(),
                      )
                      : const _HonorFallback(),
            ),
            Expanded(
              child: Padding(
                padding: const EdgeInsets.all(10),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _ChannelLabel(article: article),
                    const SizedBox(height: 4),
                    Text(
                      article.title,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        fontWeight: FontWeight.w800,
                        fontSize: 13.5,
                      ),
                    ),
                    if (snippet.isNotEmpty) ...[
                      const SizedBox(height: 5),
                      Text(
                        snippet,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          color: AppColors.textSecondary,
                          fontSize: 12,
                          height: 1.25,
                        ),
                      ),
                    ],
                    const Spacer(),
                    if (date != null) _DateLine(date: date),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ChannelLabel extends StatelessWidget {
  const _ChannelLabel({required this.article});

  final Article article;

  @override
  Widget build(BuildContext context) {
    final label =
        article.channel == 'achievement'
            ? 'article.channel_achievement'.tr()
            : 'article.channel_alumni'.tr();

    return Text(
      label.toUpperCase(),
      maxLines: 1,
      overflow: TextOverflow.ellipsis,
      style: const TextStyle(
        color: AppColors.primary,
        fontSize: 11,
        fontWeight: FontWeight.w800,
        letterSpacing: 0.4,
      ),
    );
  }
}

class _DateLine extends StatelessWidget {
  const _DateLine({required this.date});

  final String date;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        const Icon(
          Icons.calendar_today_outlined,
          size: 13,
          color: AppColors.textSecondary,
        ),
        const SizedBox(width: 4),
        Text(
          date,
          style: const TextStyle(color: AppColors.textSecondary, fontSize: 12),
        ),
      ],
    );
  }
}

class _HonorFallback extends StatelessWidget {
  const _HonorFallback();

  @override
  Widget build(BuildContext context) {
    return Container(
      color: AppColors.primaryLighter,
      child: const Center(
        child: Icon(Icons.emoji_events_outlined,
            color: AppColors.primary, size: 40),
      ),
    );
  }
}

String _articlePath(Article article) {
  return '${RouteNames.articles}/${article.channel}/${article.id}';
}
