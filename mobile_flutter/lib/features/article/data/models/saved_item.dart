/// A saved (bookmarked) item (`GET /api/articles/saved`). For mobile we save
/// only articles, so [itemType] is "NEWS". The response carries the reference
/// (itemType/itemId), not the article body — the title is resolved separately.
class SavedItem {
  final int id;
  final String itemType;
  final int itemId;
  final String? note;
  final DateTime? savedAt;

  const SavedItem({
    required this.id,
    required this.itemType,
    required this.itemId,
    this.note,
    this.savedAt,
  });

  factory SavedItem.fromJson(Map<String, dynamic> json) {
    return SavedItem(
      id: (json['id'] as num?)?.toInt() ?? 0,
      itemType: json['itemType']?.toString() ?? 'NEWS',
      itemId: (json['itemId'] as num?)?.toInt() ?? 0,
      note: json['note'] as String?,
      savedAt: json['savedAt'] is String
          ? DateTime.tryParse(json['savedAt'] as String)
          : null,
    );
  }
}
