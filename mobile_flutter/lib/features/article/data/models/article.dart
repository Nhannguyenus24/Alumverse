/// A published article (news channel). Mirrors the web client's normalized
/// news shape (`frontend/src/hooks/articles/normalizeArticle.js`):
/// id, title, content (HTML), thumbnailUrl, publishedAt, topic.
class Article {
  final int id;
  final String channel;
  final String title;
  final String? content;
  final String? thumbnailUrl;
  final DateTime? publishedAt;
  final String? topic;

  const Article({
    required this.id,
    this.channel = 'news',
    required this.title,
    this.content,
    this.thumbnailUrl,
    this.publishedAt,
    this.topic,
  });

  factory Article.fromJson(Map<String, dynamic> json, {String channel = 'news'}) {
    return Article(
      id: (json['id'] as num).toInt(),
      channel: json['channel'] as String? ?? channel,
      title: json['title'] as String? ?? '',
      content: json['content'] as String? ?? json['description'] as String?,
      thumbnailUrl:
          json['thumbnailUrl'] as String? ?? json['imageUrl'] as String?,
      publishedAt: _parseDate(
        json['publishedAt'] ??
            json['published_at'] ??
            json['awardedDate'] ??
            json['awarded_date'] ??
            json['createdAt'] ??
            json['created_at'],
      ),
      topic: json['topic'] as String?,
    );
  }

  static DateTime? _parseDate(Object? value) {
    if (value is String && value.isNotEmpty) return DateTime.tryParse(value);
    return null;
  }
}
