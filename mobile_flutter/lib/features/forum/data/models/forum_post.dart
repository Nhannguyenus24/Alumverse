/// A post/comment inside a topic (`GET /api/forum/post`). `content` is HTML.
class ForumPost {
  final int id;
  final int? topicId;
  final String content;
  final int? authorMemberId;
  final String? authorName;
  final String? role;
  final DateTime? createdAt;
  final int? answerToPostId;
  final int likeCount;
  final bool likedByMe;

  const ForumPost({
    required this.id,
    this.topicId,
    this.content = '',
    this.authorMemberId,
    this.authorName,
    this.role,
    this.createdAt,
    this.answerToPostId,
    this.likeCount = 0,
    this.likedByMe = false,
  });

  ForumPost copyWith({int? likeCount, bool? likedByMe}) => ForumPost(
        id: id,
        topicId: topicId,
        content: content,
        authorMemberId: authorMemberId,
        authorName: authorName,
        role: role,
        createdAt: createdAt,
        answerToPostId: answerToPostId,
        likeCount: likeCount ?? this.likeCount,
        likedByMe: likedByMe ?? this.likedByMe,
      );

  factory ForumPost.fromJson(Map<String, dynamic> json) {
    return ForumPost(
      id: (json['id'] as num).toInt(),
      topicId: (json['topicId'] as num?)?.toInt(),
      content: json['content'] as String? ?? '',
      authorMemberId: (json['authorMemberId'] as num?)?.toInt(),
      authorName: json['authorName'] as String?,
      role: json['role'] as String?,
      createdAt: json['createdAt'] is String
          ? DateTime.tryParse(json['createdAt'] as String)
          : null,
      answerToPostId: (json['answerToPostId'] as num?)?.toInt(),
      likeCount: ((json['likeCount'] ?? json['reactionCount']) as num?)?.toInt() ?? 0,
      // Backend returns the current user's like state as `isLike`.
      likedByMe: (json['isLike'] ?? json['likedByMe']) as bool? ?? false,
    );
  }
}
