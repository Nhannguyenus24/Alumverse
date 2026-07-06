import 'package:cached_network_image/cached_network_image.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/router/route_names.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/utils/html_utils.dart';
import '../../../../core/utils/image_url.dart';
import '../../../article/data/models/article.dart';
import '../../../article/presentation/providers/news_provider.dart';
import 'section_title.dart';

/// "Cộng đồng cựu sinh viên" — compact honors feed from alumni + achievements.
class CommunitySection extends ConsumerWidget {
  const CommunitySection({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(honorsArticlesProvider);

    return async.when(
      loading: () => const SizedBox.shrink(),
      error: (_, __) => const SizedBox.shrink(),
      data: (articles) {
        if (articles.isEmpty) return const SizedBox.shrink();
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            SectionTitle(
              'article.honors_title_upper'.tr(),
              action: TextButton(
                onPressed: () => context.push(RouteNames.honors),
                child: Text('home.view_all'.tr()),
              ),
            ),
            Column(
              children:
                  articles
                      .take(4)
                      .map((article) => _CommunityArticleCard(article: article))
                      .toList(growable: false),
            ),
          ],
        );
      },
    );
  }
}

class _CommunityArticleCard extends StatelessWidget {
  const _CommunityArticleCard({required this.article});

  final Article article;

  @override
  Widget build(BuildContext context) {
    final thumb = resolveImageUrl(article.thumbnailUrl);
    final snippet = HtmlUtils.toPlainText(article.content);
    final date =
        article.publishedAt != null
            ? DateFormat('dd/MM/yyyy').format(article.publishedAt!)
            : null;

    return Card(
      margin: const EdgeInsets.fromLTRB(16, 0, 16, 12),
      clipBehavior: Clip.antiAlias,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      elevation: 1,
      child: InkWell(
        onTap:
            () => context.push(
              '${RouteNames.articles}/${article.channel}/${article.id}',
            ),
        child: IntrinsicHeight(
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              SizedBox(
                width: 112,
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
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.all(12),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        _channelLabel(article).toUpperCase(),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          color: AppColors.primary,
                          fontSize: 11,
                          fontWeight: FontWeight.w900,
                          letterSpacing: 0.4,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        article.title,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          fontSize: 14.5,
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
                            fontSize: 12,
                            height: 1.3,
                          ),
                        ),
                      ],
                      if (date != null) ...[
                        const SizedBox(height: 6),
                        Text(
                          date,
                          style: const TextStyle(
                            color: AppColors.textSecondary,
                            fontSize: 12,
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  String _channelLabel(Article article) {
    if (article.channel == 'achievement') {
      return 'article.channel_achievement'.tr();
    }
    return 'article.channel_alumni'.tr();
  }
}

class _ImageFallback extends StatelessWidget {
  const _ImageFallback();

  @override
  Widget build(BuildContext context) {
    return Container(
      color: AppColors.primaryLighter,
      child: const Center(
        child: Icon(
          Icons.emoji_events_outlined,
          color: AppColors.primary,
          size: 32,
        ),
      ),
    );
  }
}
