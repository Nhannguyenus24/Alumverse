import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/constants/api_endpoints.dart';
import '../../../../core/network/dio_client.dart';
import '../models/article.dart';
import '../models/saved_item.dart';

final articleRepositoryProvider = Provider<ArticleRepository>((ref) {
  return ArticleRepository(ref.watch(dioProvider));
});

/// Reads published articles for the organization currently selected in the UI.
class ArticleRepository {
  ArticleRepository(this._dio);

  final Dio _dio;

  Future<List<Article>> getPublishedNews({
    int page = 0,
    int limit = 10,
    int? organizationId,
  }) async {
    final res = await _dio.get(
      ApiEndpoints.newsPublished,
      queryParameters: {
        'page': page,
        'limit': limit,
        if (organizationId != null) 'organizationId': organizationId,
      },
    );
    return _itemsFrom(res.data, channel: 'news');
  }

  Future<List<Article>> getPublishedAlumniPosts({
    int page = 0,
    int limit = 10,
    int? organizationId,
  }) async {
    final res = await _dio.get(
      ApiEndpoints.alumniPostsPublished,
      queryParameters: {
        'page': page,
        'limit': limit,
        if (organizationId != null) 'organizationId': organizationId,
      },
    );
    return _itemsFrom(res.data, channel: 'alumni');
  }

  Future<List<Article>> getApprovedAchievements({
    int page = 0,
    int limit = 10,
    int? organizationId,
  }) async {
    final res = await _dio.get(
      ApiEndpoints.achievementsApproved,
      queryParameters: {
        'page': page,
        'limit': limit,
        if (organizationId != null) 'organizationId': organizationId,
      },
    );
    return _itemsFrom(res.data, channel: 'achievement');
  }

  Future<Article> getArticleDetail(int id, {String channel = 'news'}) async {
    final res = await _dio.get(_detailEndpoint(channel, id));
    final data =
        res.data is Map && res.data['data'] is Map
            ? res.data['data'] as Map<String, dynamic>
            : res.data as Map<String, dynamic>;
    return Article.fromJson(data, channel: channel);
  }

  Future<Article> getNewsDetail(int id) {
    return getArticleDetail(id);
  }

  String _detailEndpoint(String channel, int id) {
    return switch (channel) {
      'alumni' => ApiEndpoints.alumniPostDetail(id),
      'achievement' => ApiEndpoints.achievementDetail(id),
      _ => ApiEndpoints.newsDetail(id),
    };
  }

  // ─── Saved items (bookmarked articles) ────────────────────────────────────

  static const String _newsType = 'NEWS';

  /// Whether the current user has saved the news article [id].
  Future<bool> isSaved(int id) async {
    final res = await _dio.get(
      ApiEndpoints.savedItemCheck,
      queryParameters: {'itemType': _newsType, 'itemId': id},
    );
    final data =
        res.data is Map && res.data['data'] != null
            ? res.data['data']
            : res.data;
    if (data is bool) return data;
    if (data is Map) {
      final v = data['saved'] ?? data['isSaved'];
      if (v is bool) return v;
    }
    return false;
  }

  /// Save (bookmark) a news article.
  Future<void> save(int id) => _dio.post(
    ApiEndpoints.savedItems,
    data: {'itemType': _newsType, 'itemId': id},
  );

  /// Remove a news article from saved.
  Future<void> unsave(int id) => _dio.delete(
    ApiEndpoints.savedItems,
    queryParameters: {'itemType': _newsType, 'itemId': id},
  );

  /// The current user's saved articles (references only — resolve titles via
  /// [getNewsDetail]).
  Future<List<SavedItem>> getSavedArticles({
    int page = 0,
    int limit = 50,
  }) async {
    final res = await _dio.get(
      ApiEndpoints.savedItemsByType(_newsType),
      queryParameters: {'page': page, 'limit': limit},
    );
    final data = res.data is Map ? res.data['data'] : res.data;
    final list =
        data is Map ? (data['items'] ?? data['content'] ?? data['data']) : data;
    if (list is! List) return const [];
    return list
        .whereType<Map>()
        .map((e) => SavedItem.fromJson(e.cast<String, dynamic>()))
        .toList();
  }

  /// Unwrap `ApiResponse.data.items` → List<Article>. Tolerates the list being
  /// directly under `data` as well.
  List<Article> _itemsFrom(dynamic body, {String channel = 'news'}) {
    final data = body is Map ? body['data'] : body;
    final items = data is Map ? data['items'] : data;
    if (items is! List) return const [];
    return items
        .map(
          (e) => Article.fromJson(e as Map<String, dynamic>, channel: channel),
        )
        .toList();
  }
}
