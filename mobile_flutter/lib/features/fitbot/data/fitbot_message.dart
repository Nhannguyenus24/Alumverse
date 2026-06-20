/// A single chat message in the FitBot conversation.
class FitBotMessage {
  final String id;
  final String text;
  final bool isBot;
  final DateTime timestamp;

  const FitBotMessage({
    required this.id,
    required this.text,
    required this.isBot,
    required this.timestamp,
  });

  FitBotMessage copyWith({String? text}) => FitBotMessage(
        id: id,
        text: text ?? this.text,
        isBot: isBot,
        timestamp: timestamp,
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'text': text,
        'isBot': isBot,
        'timestamp': timestamp.toIso8601String(),
      };

  factory FitBotMessage.fromJson(Map<String, dynamic> json) => FitBotMessage(
        id: json['id']?.toString() ?? '',
        text: json['text']?.toString() ?? '',
        isBot: json['isBot'] == true,
        timestamp:
            DateTime.tryParse(json['timestamp']?.toString() ?? '') ??
                DateTime.fromMillisecondsSinceEpoch(0),
      );
}
