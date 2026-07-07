import 'package:cached_network_image/cached_network_image.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/router/route_names.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/utils/article_topic_label.dart';
import '../../../../core/utils/html_utils.dart';
import '../../../../core/utils/image_url.dart';
import '../../../article/data/models/article.dart';
import '../../../article/presentation/providers/news_provider.dart';
import 'section_title.dart';

/// "Tin tức" — live published news from the API. Handles loading,
/// error, and empty states; tapping a card opens the article detail.
class NewsSection extends ConsumerWidget {
  const NewsSection({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final newsAsync = ref.watch(publishedNewsProvider);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SectionTitle(
          'article.title'.tr(),
          action: TextButton(
            onPressed: () => context.push(RouteNames.news),
            child: Text('home.view_all'.tr()),
          ),
        ),
        newsAsync.when(
          loading:
              () => const Padding(
                padding: EdgeInsets.all(24),
                child: Center(child: CircularProgressIndicator()),
              ),
          error:
              (e, _) => _Message(
                icon: Icons.cloud_off_rounded,
                text: 'article.load_failed'.tr(),
                onRetry: () => ref.invalidate(publishedNewsProvider),
              ),
          data: (news) {
            if (news.isEmpty) {
              return _Message(
                icon: Icons.article_outlined,
                text: 'article.no_news'.tr(),
              );
            }
            return Column(
              children: news
                  .take(5)
                  .map((a) => _NewsCard(article: a))
                  .toList(growable: false),
            );
          },
        ),
      ],
    );
  }
}

class _NewsCard extends StatelessWidget {
  const _NewsCard({required this.article});

  final Article article;

  @override
  Widget build(BuildContext context) {
    final thumb = resolveImageUrl(article.thumbnailUrl);
    final snippet = HtmlUtils.toPlainText(article.content);
    final date =
        article.publishedAt != null
            ? DateFormat('dd/MM/yyyy').format(article.publishedAt!)
            : null;
    final topicLabel = articleTopicLabel(article.topic);

    return Card(
      margin: const EdgeInsets.fromLTRB(16, 0, 16, 12),
      clipBehavior: Clip.antiAlias,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      elevation: 1,
      child: InkWell(
        onTap: () => context.push('${RouteNames.articles}/${article.id}'),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
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
                        errorWidget: (_, __, ___) => const _ImageFallback(),
                      )
                      : const _ImageFallback(),
            ),
            Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (topicLabel.isNotEmpty) ...[
                    Text(
                      topicLabel.toUpperCase(),
                      style: const TextStyle(
                        color: AppColors.primary,
                        fontSize: 11,
                        fontWeight: FontWeight.w900,
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
                      fontSize: 15.5,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  if (snippet.isNotEmpty) ...[
                    const SizedBox(height: 4),
                    Text(
                      snippet,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        color: AppColors.textSecondary,
                        fontSize: 13,
                        height: 1.4,
                      ),
                    ),
                  ],
                  if (date != null) ...[
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        const Icon(
                          Icons.calendar_today_outlined,
                          size: 13,
                          color: AppColors.textSecondary,
                        ),
                        const SizedBox(width: 4),
                        Text(
                          date,
                          style: const TextStyle(
                            color: AppColors.textSecondary,
                            fontSize: 12,
                          ),
                        ),
                      ],
                    ),
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

class _ImageFallback extends StatelessWidget {
  const _ImageFallback();

  @override
  Widget build(BuildContext context) {
    return Container(
      color: AppColors.primaryLighter,
      child: const Center(
        child: Icon(Icons.image_outlined, color: AppColors.primary, size: 40),
      ),
    );
  }
}

class _Message extends StatelessWidget {
  const _Message({required this.icon, required this.text, this.onRetry});

  final IconData icon;
  final String text;
  final VoidCallback? onRetry;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(24),
      child: Center(
        child: Column(
          children: [
            Icon(icon, size: 40, color: AppColors.textSecondary),
            const SizedBox(height: 8),
            Text(text, style: const TextStyle(color: AppColors.textSecondary)),
            if (onRetry != null) ...[
              const SizedBox(height: 8),
              TextButton(onPressed: onRetry, child: Text('common.retry'.tr())),
            ],
          ],
        ),
      ),
    );
  }
}
