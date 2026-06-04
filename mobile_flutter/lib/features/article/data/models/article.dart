/// A published article (news channel). Mirrors the web client's normalized
/// news shape (`frontend/src/hooks/articles/normalizeArticle.js`):
/// id, title, content (HTML), thumbnailUrl, publishedAt, topic.
class Article {
  final int id;
  final String title;
  final String? content;
  final String? thumbnailUrl;
  final DateTime? publishedAt;
  final String? topic;

  const Article({
    required this.id,
    required this.title,
    this.content,
    this.thumbnailUrl,
    this.publishedAt,
    this.topic,
  });

  factory Article.fromJson(Map<String, dynamic> json) {
    return Article(
      id: (json['id'] as num).toInt(),
      title: json['title'] as String? ?? '',
      content: json['content'] as String?,
      thumbnailUrl: json['thumbnailUrl'] as String?,
      publishedAt: _parseDate(json['publishedAt']),
      topic: json['topic'] as String?,
    );
  }

  static DateTime? _parseDate(Object? value) {
    if (value is String && value.isNotEmpty) return DateTime.tryParse(value);
    return null;
  }
}
