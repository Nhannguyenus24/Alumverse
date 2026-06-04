import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/utils/html_utils.dart';
import '../../../../core/utils/image_url.dart';
import '../providers/news_provider.dart';

/// Article detail. Renders the article as plain text for now (the body is
/// ReactQuill HTML — a full HTML renderer can replace [HtmlUtils.toPlainText]
/// later without touching the data layer).
class ArticleDetailPage extends ConsumerWidget {
  const ArticleDetailPage({super.key, required this.articleId});

  final int articleId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(newsDetailProvider(articleId));

    return Scaffold(
      appBar: AppBar(title: const Text('Chi tiết bài viết')),
      body: async.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(Icons.cloud_off_rounded,
                    size: 48, color: AppColors.textSecondary),
                const SizedBox(height: 12),
                const Text('Không tải được bài viết'),
                const SizedBox(height: 12),
                TextButton(
                  onPressed: () => ref.invalidate(newsDetailProvider(articleId)),
                  child: const Text('Thử lại'),
                ),
              ],
            ),
          ),
        ),
        data: (article) {
          final thumb = resolveImageUrl(article.thumbnailUrl);
          final body = HtmlUtils.toPlainText(article.content);
          final date = article.publishedAt != null
              ? DateFormat('dd/MM/yyyy').format(article.publishedAt!)
              : null;

          return ListView(
            padding: EdgeInsets.zero,
            children: [
              if (thumb != null)
                CachedNetworkImage(
                  imageUrl: thumb,
                  width: double.infinity,
                  height: 220,
                  fit: BoxFit.cover,
                  placeholder: (_, __) =>
                      Container(height: 220, color: AppColors.divider),
                  errorWidget: (_, __, ___) =>
                      Container(height: 220, color: AppColors.divider),
                ),
              Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    if (article.topic != null && article.topic!.isNotEmpty)
                      Text(
                        article.topic!.toUpperCase(),
                        style: const TextStyle(
                          color: AppColors.primary,
                          fontWeight: FontWeight.w700,
                          fontSize: 12,
                          letterSpacing: 0.5,
                        ),
                      ),
                    const SizedBox(height: 6),
                    Text(
                      article.title,
                      style: const TextStyle(
                        fontSize: 22,
                        fontWeight: FontWeight.bold,
                        height: 1.3,
                      ),
                    ),
                    if (date != null) ...[
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          const Icon(Icons.calendar_today_outlined,
                              size: 14, color: AppColors.textSecondary),
                          const SizedBox(width: 4),
                          Text(date,
                              style: const TextStyle(
                                  color: AppColors.textSecondary, fontSize: 13)),
                        ],
                      ),
                    ],
                    const SizedBox(height: 16),
                    Text(
                      body,
                      style: const TextStyle(fontSize: 15, height: 1.6),
                    ),
                  ],
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}
