/// Bank account that receives donations for a fund (nested in the detail).
class FundReceivingInfo {
  final int id;
  final String? accountNumber;
  final String? accountName;
  final String? bankName;
  final bool isActive;

  const FundReceivingInfo({
    required this.id,
    this.accountNumber,
    this.accountName,
    this.bankName,
    this.isActive = true,
  });

  factory FundReceivingInfo.fromJson(Map<String, dynamic> json) {
    return FundReceivingInfo(
      id: (json['id'] as num?)?.toInt() ?? 0,
      accountNumber: json['accountNumber'] as String?,
      accountName: json['accountName'] as String?,
      bankName: json['bankName'] as String?,
      isActive: json['isActive'] as bool? ?? true,
    );
  }
}

/// Full fundraising campaign as returned by `GET /api/funds/{id}`
/// (the backend `FundDetailResponse`).
class FundDetail {
  final int id;
  final String name;
  final String? logoUrl;
  final String? managerName;
  final String? organizationName;
  final String? statusName;
  final int donorCount;
  final String? descriptionShort;
  final String? descriptionFull;
  final double targetAmount;
  final double currentAmount;
  final DateTime? timeStarted;
  final DateTime? timeEnded;
  final String? topic;
  final FundReceivingInfo? receivingInfo;

  const FundDetail({
    required this.id,
    required this.name,
    this.logoUrl,
    this.managerName,
    this.organizationName,
    this.statusName,
    this.donorCount = 0,
    this.descriptionShort,
    this.descriptionFull,
    this.targetAmount = 0,
    this.currentAmount = 0,
    this.timeStarted,
    this.timeEnded,
    this.topic,
    this.receivingInfo,
  });

  double get progress =>
      targetAmount <= 0 ? 0 : (currentAmount / targetAmount).clamp(0, 1);

  /// True if the campaign cannot accept donations: time has passed or the
  /// status reads as closed.
  bool get isClosed {
    if (timeEnded != null && timeEnded!.isBefore(DateTime.now())) return true;
    final s = statusName?.toLowerCase() ?? '';
    return s.contains('đóng') || s.contains('closed') || s.contains('kết thúc');
  }

  /// Average donation amount, 0 when there are no donors yet.
  double get averageDonation =>
      donorCount <= 0 ? 0 : currentAmount / donorCount;

  factory FundDetail.fromJson(Map<String, dynamic> json) {
    final info = json['fundReceivingInfo'];
    return FundDetail(
      id: (json['id'] as num).toInt(),
      name: json['name'] as String? ?? '',
      logoUrl: json['logoUrl'] as String?,
      managerName: json['managerName'] as String?,
      organizationName: json['organizationName'] as String?,
      statusName: json['statusName'] as String?,
      donorCount: (json['donorCount'] as num?)?.toInt() ?? 0,
      descriptionShort: json['descriptionShort'] as String?,
      descriptionFull: json['descriptionFull'] as String?,
      targetAmount: (json['targetAmount'] as num?)?.toDouble() ?? 0,
      currentAmount: (json['currentAmount'] as num?)?.toDouble() ?? 0,
      timeStarted: _date(json['timeStarted']),
      timeEnded: _date(json['timeEnded']),
      topic: json['topic'] as String?,
      receivingInfo: info is Map<String, dynamic>
          ? FundReceivingInfo.fromJson(info)
          : null,
    );
  }

  static DateTime? _date(Object? v) =>
      v is String && v.isNotEmpty ? DateTime.tryParse(v) : null;
}
