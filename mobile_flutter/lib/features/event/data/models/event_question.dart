/// A registration question for an event (`GET /api/events/{id}/questions`).
/// `type` is one of SHORT_TEXT / SINGLE_CHOICE / MULTI_CHOICE.
class EventQuestion {
  final int id;
  final String type;
  final String label;
  final List<String> options;
  final bool required;
  final int orderIndex;

  const EventQuestion({
    required this.id,
    required this.type,
    required this.label,
    this.options = const [],
    this.required = false,
    this.orderIndex = 0,
  });

  bool get isShortText => type == 'SHORT_TEXT';
  bool get isSingleChoice => type == 'SINGLE_CHOICE';
  bool get isMultiChoice => type == 'MULTI_CHOICE';

  factory EventQuestion.fromJson(Map<String, dynamic> json) {
    return EventQuestion(
      id: (json['id'] as num).toInt(),
      type: json['type'] as String? ?? 'SHORT_TEXT',
      label: json['label'] as String? ?? '',
      options:
          (json['options'] as List?)?.map((e) => e.toString()).toList() ??
          const [],
      required: json['required'] as bool? ?? false,
      orderIndex: (json['orderIndex'] as num?)?.toInt() ?? 0,
    );
  }
}
