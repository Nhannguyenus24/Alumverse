/// A discussion topic/thread (`GET /api/forum/topic`).
class ForumTopic {
  final int id;
  final String title;
  final int? categoryId;
  final int? createdByMemberId;
  final String? authorName;
  final String? authorAvatarUrl;
  final DateTime? createdAt;
  final DateTime? updatedAt;
  final int viewCount;
  final int replyCount;

  const ForumTopic({
    required this.id,
    required this.title,
    this.categoryId,
    this.createdByMemberId,
    this.authorName,
    this.authorAvatarUrl,
    this.createdAt,
    this.updatedAt,
    this.viewCount = 0,
    this.replyCount = 0,
  });

  factory ForumTopic.fromJson(Map<String, dynamic> json) {
    return ForumTopic(
      id: (json['id'] as num).toInt(),
      title: json['title'] as String? ?? '',
      categoryId: (json['categoryId'] as num?)?.toInt(),
      createdByMemberId: (json['createdByMemberId'] as num?)?.toInt(),
      authorName: json['authorName'] as String? ??
          json['createdByName'] as String? ??
          json['creatorName'] as String?,
      authorAvatarUrl: json['authorAvatarUrl'] as String? ??
          json['createdByAvatarUrl'] as String? ??
          json['creatorAvatarUrl'] as String?,
      createdAt:
          json['createdAt'] is String
              ? DateTime.tryParse(json['createdAt'] as String)
              : null,
      updatedAt:
          json['updatedAt'] is String
              ? DateTime.tryParse(json['updatedAt'] as String)
              : null,
      viewCount: (json['viewCount'] as num?)?.toInt() ?? 0,
      replyCount:
          ((json['postCount'] ?? json['replyCount']) as num?)?.toInt() ?? 0,
    );
  }
}
