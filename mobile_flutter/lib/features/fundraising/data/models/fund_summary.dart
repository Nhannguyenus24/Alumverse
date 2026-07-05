/// A fundraising campaign as returned by `GET /api/funds`
/// (the backend `FundListItemResponse`).
class FundSummary {
  final int id;
  final int? organizationId;
  final int donorCount;
  final String? managerName;
  final String name;
  final String? logoUrl;
  final String? descriptionShort;
  final double targetAmount;
  final double currentAmount;
  final DateTime? timeStarted;
  final DateTime? timeEnded;
  final String? topic;

  const FundSummary({
    required this.id,
    this.organizationId,
    this.donorCount = 0,
    this.managerName,
    required this.name,
    this.logoUrl,
    this.descriptionShort,
    this.targetAmount = 0,
    this.currentAmount = 0,
    this.timeStarted,
    this.timeEnded,
    this.topic,
  });

  /// Raised / target, clamped to 0..1. Returns 0 when there is no target.
  double get progress =>
      targetAmount <= 0 ? 0 : (currentAmount / targetAmount).clamp(0, 1);

  /// A campaign is over once its end time has passed.
  bool get isEnded => timeEnded != null && timeEnded!.isBefore(DateTime.now());

  factory FundSummary.fromJson(Map<String, dynamic> json) {
    return FundSummary(
      id: (json['id'] as num).toInt(),
      organizationId: (json['organizationId'] as num?)?.toInt(),
      donorCount: (json['donorCount'] as num?)?.toInt() ?? 0,
      managerName: json['managerName'] as String?,
      name: json['name'] as String? ?? '',
      logoUrl: json['logoUrl'] as String?,
      descriptionShort: json['descriptionShort'] as String?,
      targetAmount: (json['targetAmount'] as num?)?.toDouble() ?? 0,
      currentAmount: (json['currentAmount'] as num?)?.toDouble() ?? 0,
      timeStarted: _date(json['timeStarted']),
      timeEnded: _date(json['timeEnded']),
      topic: json['topic'] as String?,
    );
  }

  static DateTime? _date(Object? v) =>
      v is String && v.isNotEmpty ? DateTime.tryParse(v) : null;
}
