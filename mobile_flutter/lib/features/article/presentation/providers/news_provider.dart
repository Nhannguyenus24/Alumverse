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

final newsDetailProvider =
    FutureProvider.autoDispose.family<Article, int>((ref, id) async {
  return ref.watch(articleRepositoryProvider).getNewsDetail(id);
});

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
