import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../data/models/article.dart';
import '../../data/models/saved_item.dart';
import '../../data/repositories/article_repository.dart';

/// Latest published news for the home feed. Auto-refetches when invalidated
/// (pull-to-refresh on the home screen).
final publishedNewsProvider = FutureProvider<List<Article>>((ref) async {
  final repo = ref.watch(articleRepositoryProvider);
  return repo.getPublishedNews(page: 0, limit: 10);
});

final honorsArticlesProvider = FutureProvider<List<Article>>((ref) async {
  final repo = ref.watch(articleRepositoryProvider);
  final results = await Future.wait([
    repo.getPublishedAlumniPosts(page: 0, limit: 10),
    repo.getApprovedAchievements(page: 0, limit: 10),
  ]);
  final articles = [...results[0], ...results[1]];
  articles.sort((a, b) {
    final left = a.publishedAt ?? DateTime.fromMillisecondsSinceEpoch(0);
    final right = b.publishedAt ?? DateTime.fromMillisecondsSinceEpoch(0);
    return right.compareTo(left);
  });
  return articles;
});

final newsDetailProvider = FutureProvider.autoDispose.family<Article, int>((
  ref,
  id,
) async {
  return ref.watch(articleRepositoryProvider).getNewsDetail(id);
});

final articleDetailProvider =
    FutureProvider.autoDispose.family<Article, ArticleDetailRequest>((
      ref,
      request,
    ) async {
      return ref
          .watch(articleRepositoryProvider)
          .getArticleDetail(request.id, channel: request.channel);
});

class ArticleDetailRequest {
  const ArticleDetailRequest({required this.id, required this.channel});

  final int id;
  final String channel;

  @override
  bool operator ==(Object other) {
    return other is ArticleDetailRequest &&
        other.id == id &&
        other.channel == channel;
  }

  @override
  int get hashCode => Object.hash(id, channel);
}

/// The current user's saved (bookmarked) articles. Invalidated after save/unsave.
final savedArticlesProvider = FutureProvider<List<SavedItem>>((ref) async {
  return ref.watch(articleRepositoryProvider).getSavedArticles();
});

/// Whether a given article is saved by the current user.
final isArticleSavedProvider = FutureProvider.autoDispose.family<bool, int>((
  ref,
  id,
) async {
  return ref.read(articleRepositoryProvider).isSaved(id);
});
