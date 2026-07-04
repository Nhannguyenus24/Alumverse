import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/constants/api_endpoints.dart';
import '../../../../core/network/dio_client.dart';
import '../models/forum_category.dart';
import '../models/forum_post.dart';
import '../models/forum_topic.dart';

final forumRepositoryProvider = Provider<ForumRepository>((ref) {
  return ForumRepository(ref.watch(dioProvider));
});

class ForumRepository {
  ForumRepository(this._dio);

  final Dio _dio;

  Future<List<ForumCategory>> getCategories(int organizationId) async {
    final res = await _dio.get(
      ApiEndpoints.forumCategory,
      queryParameters: {'organizationId': organizationId},
    );
    return _list(res.data).map((e) => ForumCategory.fromJson(e)).toList();
  }

  Future<List<ForumTopic>> getTopics(
    int categoryId, {
    String? keyword,
    int page = 0,
    int size = 50,
  }) async {
    final res = await _dio.get(
      ApiEndpoints.forumTopic,
      queryParameters: {
        'categoryId': categoryId,
        if (keyword != null && keyword.isNotEmpty) 'keyword': keyword,
        'page': page,
        'size': size,
      },
    );
    return _items(res.data).map((e) => ForumTopic.fromJson(e)).toList();
  }

  Future<List<ForumPost>> getPosts(
    int topicId, {
    int? memberId,
    int page = 0,
    int size = 50,
  }) async {
    final res = await _dio.get(
      ApiEndpoints.forumPost,
      queryParameters: {
        'topicId': topicId,
        if (memberId != null) 'memberId': memberId,
        'page': page,
        'size': size,
      },
    );
    final posts = _items(res.data).map((e) => ForumPost.fromJson(e)).toList();

    // The post list doesn't include the like total — fetch it per post (in
    // parallel) so the heart shows the real count, matching the web client.
    final counts = await Future.wait(
      posts.map((p) => reactionCount(p.id).catchError((_) => 0)),
    );
    return [
      for (var i = 0; i < posts.length; i++)
        posts[i].copyWith(likeCount: counts[i]),
    ];
  }

  /// Create a new topic. Returns the created topic id (for posting the opening
  /// message), or null if it cannot be read.
  Future<int?> createTopic({
    required int organizationId,
    required String title,
    required int createdByMemberId,
    required int categoryId,
  }) async {
    final res = await _dio.post(
      ApiEndpoints.forumTopic,
      data: {
        'organizationId': organizationId,
        'title': title,
        'createdByMemberId': createdByMemberId,
        'categoryId': categoryId,
      },
    );
    final data =
        res.data is Map && res.data['data'] is Map
            ? res.data['data'] as Map
            : res.data;
    return data is Map ? (data['id'] as num?)?.toInt() : null;
  }

  Future<void> createPost({
    required int topicId,
    required int authorMemberId,
    required String content,
    int? answerToPostId,
  }) {
    return _dio.post(
      ApiEndpoints.forumPost,
      data: {
        'topicId': topicId,
        'authorMemberId': authorMemberId,
        'content': content,
        'answerToPostId': answerToPostId,
      },
    );
  }

  Future<void> toggleReaction({required int postId, required int memberId}) {
    return _dio.post(
      ApiEndpoints.forumPostReact,
      data: {'postId': postId, 'memberId': memberId},
    );
  }

  Future<int> reactionCount(int postId) async {
    final res = await _dio.get(ApiEndpoints.forumPostReactionCount(postId));
    final data =
        res.data is Map && res.data['data'] != null
            ? res.data['data']
            : res.data;
    if (data is Map) {
      return ((data['likes'] ?? data['count']) as num?)?.toInt() ?? 0;
    }
    return (data as num?)?.toInt() ?? 0;
  }

  // --- response unwrap helpers ---

  List<Map<String, dynamic>> _list(dynamic body) {
    final data = body is Map ? body['data'] : body;
    if (data is List) return data.cast<Map<String, dynamic>>();
    return const [];
  }

  List<Map<String, dynamic>> _items(dynamic body) {
    final data = body is Map ? body['data'] : body;
    final items = data is Map ? (data['items'] ?? data['content']) : data;
    if (items is List) return items.cast<Map<String, dynamic>>();
    return const [];
  }
}
