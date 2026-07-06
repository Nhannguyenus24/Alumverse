import 'package:cached_network_image/cached_network_image.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_widget_from_html_core/flutter_widget_from_html_core.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/utils/article_topic_label.dart';
import '../../../../core/utils/image_url.dart';
import '../../../../shared/widgets/app_toast.dart';
import '../../data/repositories/article_repository.dart';
import '../providers/news_provider.dart';

/// Article detail. The body is ReactQuill HTML (same content the web frontend
/// renders) — displayed with [HtmlWidget] so formatting, lists and inline
/// images match the web. Relative image URLs are resolved against the server.
class ArticleDetailPage extends ConsumerWidget {
  const ArticleDetailPage({
    super.key,
    required this.articleId,
    this.channel = 'news',
  });

  final int articleId;
  final String channel;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final request = ArticleDetailRequest(id: articleId, channel: channel);
    final async = ref.watch(articleDetailProvider(request));
    final canSave = channel == 'news';

    return Scaffold(
      appBar: AppBar(
        title: Text('article.detail_title'.tr()),
        actions: [
          if (canSave) _SaveButton(articleId: articleId),
        ],
      ),
      body: async.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error:
            (e, _) => Center(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(
                      Icons.cloud_off_rounded,
                      size: 48,
                      color: AppColors.textSecondary,
                    ),
                    const SizedBox(height: 12),
                    Text('article.load_failed_detail'.tr()),
                    const SizedBox(height: 12),
                    TextButton(
                      onPressed:
                          () => ref.invalidate(articleDetailProvider(request)),
                      child: Text('common.retry'.tr()),
                    ),
                  ],
                ),
              ),
            ),
        data: (article) {
          final thumb = resolveImageUrl(article.thumbnailUrl);
          final date =
              article.publishedAt != null
                  ? DateFormat('dd/MM/yyyy').format(article.publishedAt!)
                  : null;
          final topicLabel = articleTopicLabel(article.topic);

          return ListView(
            padding: EdgeInsets.zero,
            children: [
              if (thumb != null)
                CachedNetworkImage(
                  imageUrl: thumb,
                  width: double.infinity,
                  height: 220,
                  fit: BoxFit.cover,
                  placeholder:
                      (_, __) =>
                          Container(height: 220, color: AppColors.divider),
                  errorWidget:
                      (_, __, ___) =>
                          Container(height: 220, color: AppColors.divider),
                ),
              Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    if (topicLabel.isNotEmpty)
                      Text(
                        topicLabel.toUpperCase(),
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
                          const Icon(
                            Icons.calendar_today_outlined,
                            size: 14,
                            color: AppColors.textSecondary,
                          ),
                          const SizedBox(width: 4),
                          Text(
                            date,
                            style: const TextStyle(
                              color: AppColors.textSecondary,
                              fontSize: 13,
                            ),
                          ),
                        ],
                      ),
                    ],
                    const SizedBox(height: 16),
                    HtmlWidget(
                      article.content ?? '',
                      textStyle: const TextStyle(fontSize: 15, height: 1.6),
                      // ReactQuill stores relative image paths; resolve them
                      // against the server so inline images load.
                      customWidgetBuilder: (element) {
                        if (element.localName != 'img') return null;
                        final src = resolveImageUrl(element.attributes['src']);
                        if (src == null) return const SizedBox.shrink();
                        return Padding(
                          padding: const EdgeInsets.symmetric(vertical: 8),
                          child: CachedNetworkImage(
                            imageUrl: src,
                            fit: BoxFit.contain,
                            placeholder:
                                (_, __) => const SizedBox(
                                  height: 160,
                                  child: Center(
                                    child: CircularProgressIndicator(),
                                  ),
                                ),
                            errorWidget:
                                (_, __, ___) => const SizedBox.shrink(),
                          ),
                        );
                      },
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

/// Bookmark toggle for the article AppBar. Saves/unsaves the article and keeps
/// the saved list + saved-status providers in sync.
class _SaveButton extends ConsumerStatefulWidget {
  const _SaveButton({required this.articleId});
  final int articleId;

  @override
  ConsumerState<_SaveButton> createState() => _SaveButtonState();
}

class _SaveButtonState extends ConsumerState<_SaveButton> {
  bool _busy = false;

  Future<void> _toggle(bool currentlySaved) async {
    setState(() => _busy = true);
    final repo = ref.read(articleRepositoryProvider);
    try {
      if (currentlySaved) {
        await repo.unsave(widget.articleId);
        if (mounted) AppToast.info(context, 'article.unsaved_toast'.tr());
      } else {
        await repo.save(widget.articleId);
        if (mounted) AppToast.success(context, 'article.saved_toast'.tr());
      }
    } catch (_) {
      // Tolerate already-saved/not-saved races; resync below reflects truth.
    } finally {
      ref.invalidate(isArticleSavedProvider(widget.articleId));
      ref.invalidate(savedArticlesProvider);
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final saved =
        ref.watch(isArticleSavedProvider(widget.articleId)).valueOrNull ??
        false;
    return IconButton(
      tooltip: saved ? 'article.unsave'.tr() : 'article.save_action'.tr(),
      onPressed: _busy ? null : () => _toggle(saved),
      icon: Icon(saved ? Icons.favorite : Icons.favorite_border),
      color: saved ? AppColors.error : null,
    );
  }
}
