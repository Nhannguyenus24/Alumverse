/// A forum category (`GET /api/forum/category`). `parentId == null` marks a
/// top-level category; children point to it via [parentId].
class ForumCategory {
  final int id;
  final String name;
  final String? description;
  final int? parentId;
  final int? topicCount;
  final int? participantCount;

  const ForumCategory({
    required this.id,
    required this.name,
    this.description,
    this.parentId,
    this.topicCount,
    this.participantCount,
  });

  bool get isParent => parentId == null;

  factory ForumCategory.fromJson(Map<String, dynamic> json) {
    return ForumCategory(
      id: (json['id'] as num).toInt(),
      name: json['name'] as String? ?? '',
      description: json['description'] as String?,
      parentId: (json['parentId'] as num?)?.toInt(),
      topicCount: (json['topicCount'] as num?)?.toInt(),
      participantCount: (json['participantCount'] as num?)?.toInt(),
    );
  }
}
