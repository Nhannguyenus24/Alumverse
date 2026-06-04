import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/constants/api_endpoints.dart';
import '../../../../core/network/dio_client.dart';
import '../models/article.dart';

final articleRepositoryProvider = Provider<ArticleRepository>((ref) {
  return ArticleRepository(ref.watch(dioProvider));
});

/// Reads published articles. The organization is resolved server-side from the
/// JWT, so no orgId needs to be passed — the auth header is enough.
class ArticleRepository {
  ArticleRepository(this._dio);

  final Dio _dio;

  Future<List<Article>> getPublishedNews({int page = 0, int limit = 10}) async {
    final res = await _dio.get(
      ApiEndpoints.newsPublished,
      queryParameters: {'page': page, 'limit': limit},
    );
    return _itemsFrom(res.data);
  }

  Future<Article> getNewsDetail(int id) async {
    final res = await _dio.get(ApiEndpoints.newsDetail(id));
    final data = res.data is Map && res.data['data'] is Map
        ? res.data['data'] as Map<String, dynamic>
        : res.data as Map<String, dynamic>;
    return Article.fromJson(data);
  }

  /// Unwrap `ApiResponse.data.items` → List<Article>. Tolerates the list being
  /// directly under `data` as well.
  List<Article> _itemsFrom(dynamic body) {
    final data = body is Map ? body['data'] : body;
    final items = data is Map ? data['items'] : data;
    if (items is! List) return const [];
    return items
        .map((e) => Article.fromJson(e as Map<String, dynamic>))
        .toList();
  }
}
