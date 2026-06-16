import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../../../../core/router/route_names.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/utils/html_utils.dart';
import '../../../../core/utils/image_url.dart';
import '../../../../shared/widgets/error_view.dart';
import '../../data/models/article.dart';
import '../providers/news_provider.dart';

/// News listing — native port of the web `ActivitiesNewsPage`. Featured article
/// + a grid of the rest. Tapping a card opens the article detail.
class NewsListPage extends ConsumerWidget {
  const NewsListPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(publishedNewsProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Tin tức')),
      body: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(publishedNewsProvider);
          await ref.read(publishedNewsProvider.future);
        },
        child: async.when(
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (_, __) => ErrorView(
            message: 'Không tải được tin tức',
            onRetry: () => ref.invalidate(publishedNewsProvider),
          ),
          data: (news) {
            if (news.isEmpty) {
              return const Center(
                child: Text(
                  'Chưa có tin tức nào',
                  style: TextStyle(color: AppColors.textSecondary),
                ),
              );
            }
            final featured = news.first;
            final rest = news.length > 1 ? news.sublist(1) : <Article>[];

            return ListView(
              padding: const EdgeInsets.all(16),
              children: [
                Text(
                  'TIN TỨC',
                  style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                        fontWeight: FontWeight.w800,
                        color: AppColors.primary,
                      ),
                ),
                const SizedBox(height: 16),
                _FeaturedNewsCard(article: featured),
                if (rest.isNotEmpty) ...[
                  const SizedBox(height: 24),
                  const Text(
                    'Gợi ý',
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700),
                  ),
                  const SizedBox(height: 12),
                  GridView.builder(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    itemCount: rest.length,
                    gridDelegate:
                        const SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: 2,
                      mainAxisSpacing: 12,
                      crossAxisSpacing: 12,
                      childAspectRatio: 0.68,
                    ),
                    itemBuilder: (_, i) => _NewsCard(article: rest[i]),
                  ),
                ],
                const SizedBox(height: 24),
              ],
            );
          },
        ),
      ),
    );
  }
}

class _FeaturedNewsCard extends StatelessWidget {
  const _FeaturedNewsCard({required this.article});

  final Article article;

  @override
  Widget build(BuildContext context) {
    final thumb = resolveImageUrl(article.thumbnailUrl);
    final snippet = HtmlUtils.toPlainText(article.content);
    final date = article.publishedAt != null
        ? DateFormat('dd/MM/yyyy').format(article.publishedAt!)
        : null;

    return InkWell(
      onTap: () => context.push('${RouteNames.articles}/${article.id}'),
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
              child: thumb != null
                  ? CachedNetworkImage(
                      imageUrl: thumb,
                      fit: BoxFit.cover,
                      placeholder: (_, __) => Container(color: AppColors.divider),
                      errorWidget: (_, __, ___) => const _NewsFallback(),
                    )
                  : const _NewsFallback(),
            ),
            Padding(
              padding: const EdgeInsets.all(14),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (article.topic != null && article.topic!.isNotEmpty) ...[
                    Text(
                      article.topic!.toUpperCase(),
                      style: const TextStyle(
                        color: AppColors.primary,
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                        letterSpacing: 0.5,
                      ),
                    ),
                    const SizedBox(height: 4),
                  ],
                  Text(
                    article.title,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                        fontSize: 18, fontWeight: FontWeight.bold),
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

class _NewsCard extends StatelessWidget {
  const _NewsCard({required this.article});

  final Article article;

  @override
  Widget build(BuildContext context) {
    final thumb = resolveImageUrl(article.thumbnailUrl);
    final date = article.publishedAt != null
        ? DateFormat('dd/MM/yyyy').format(article.publishedAt!)
        : null;

    return InkWell(
      onTap: () => context.push('${RouteNames.articles}/${article.id}'),
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
              child: thumb != null
                  ? CachedNetworkImage(
                      imageUrl: thumb,
                      fit: BoxFit.cover,
                      placeholder: (_, __) => Container(color: AppColors.divider),
                      errorWidget: (_, __, ___) => const _NewsFallback(),
                    )
                  : const _NewsFallback(),
            ),
            Expanded(
              child: Padding(
                padding: const EdgeInsets.all(10),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      article.title,
                      maxLines: 3,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                          fontWeight: FontWeight.w600, fontSize: 13.5),
                    ),
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

class _DateLine extends StatelessWidget {
  const _DateLine({required this.date});

  final String date;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        const Icon(Icons.calendar_today_outlined,
            size: 13, color: AppColors.textSecondary),
        const SizedBox(width: 4),
        Text(
          date,
          style: const TextStyle(color: AppColors.textSecondary, fontSize: 12),
        ),
      ],
    );
  }
}

class _NewsFallback extends StatelessWidget {
  const _NewsFallback();

  @override
  Widget build(BuildContext context) {
    return Container(
      color: AppColors.divider,
      child: const Center(
        child: Icon(Icons.image_outlined,
            color: AppColors.textSecondary, size: 40),
      ),
    );
  }
}
