import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../auth/presentation/providers/auth_provider.dart';
import '../../../organization/presentation/providers/organization_provider.dart';
import '../../data/models/forum_category.dart';
import '../../data/models/forum_post.dart';
import '../../data/models/forum_topic.dart';
import '../../data/repositories/forum_repository.dart';

/// Current member id (== user id from the JWT), used for posts/reactions.
/// Accepts both Ref (providers) and WidgetRef (widgets).
int? currentMemberIdFromUserId(String? userId) =>
    userId == null ? null : int.tryParse(userId);

final forumCategoriesProvider =
    FutureProvider<List<ForumCategory>>((ref) async {
  final orgId = ref.watch(organizationStateProvider).valueOrNull?.id;
  if (orgId == null) return const [];
  return ref.read(forumRepositoryProvider).getCategories(orgId);
});

final forumTopicsProvider =
    FutureProvider.family<List<ForumTopic>, int>((ref, categoryId) {
  return ref.read(forumRepositoryProvider).getTopics(categoryId);
});

final forumPostsProvider =
    FutureProvider.family<List<ForumPost>, int>((ref, topicId) {
  final memberId = currentMemberIdFromUserId(
      ref.read(authStateProvider).valueOrNull?.user?.id);
  return ref
      .read(forumRepositoryProvider)
      .getPosts(topicId, memberId: memberId);
});
