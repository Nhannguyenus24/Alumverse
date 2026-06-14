/// `SessionFeedbackResponse` — feedback left by a mentee on a completed session.
class SessionFeedback {
  final int id;
  final int? sessionId;
  final int? menteeMemberId;
  final int rating;
  final String? comment;
  final bool isPublic;
  final DateTime? createdAt;

  const SessionFeedback({
    required this.id,
    this.sessionId,
    this.menteeMemberId,
    required this.rating,
    this.comment,
    this.isPublic = true,
    this.createdAt,
  });

  factory SessionFeedback.fromJson(Map<String, dynamic> json) {
    return SessionFeedback(
      id: (json['id'] as num).toInt(),
      sessionId: (json['sessionId'] as num?)?.toInt(),
      menteeMemberId: (json['menteeMemberId'] as num?)?.toInt(),
      rating: (json['rating'] as num).toInt(),
      comment: json['comment'] as String?,
      isPublic: (json['isPublic'] as bool?) ?? true,
      createdAt: json['createdAt'] is String
          ? DateTime.tryParse(json['createdAt'] as String)
          : null,
    );
  }
}
