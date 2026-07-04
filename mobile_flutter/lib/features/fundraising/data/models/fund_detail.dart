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
  final int donorCount;
  final String? descriptionShort;
  final String? descriptionFull;
  final double targetAmount;
  final double currentAmount;
  final DateTime? timeStarted;
  final DateTime? timeEnded;
  final String? topic;
  final FundReceivingInfo? receivingInfo;

  /// Contact email of the fund manager (always present — the column is NOT NULL
  /// on the backend, but kept nullable here to be safe with older data).
  final String? managerEmail;

  /// User id of the manager, derived server-side by matching [managerEmail]
  /// against the `users` table. `null` when the email is not a system member —
  /// in that case only the email is shown, without a "Connect" action.
  /// This equals `users.id`, which is the same id the chat module calls
  /// "memberId", so it can be passed straight into a connection request.
  final int? managerUserId;

  /// Avatar of the manager (from the `users` table); `null` when [managerUserId]
  /// is `null`.
  final String? managerAvatarUrl;

  const FundDetail({
    required this.id,
    required this.name,
    this.logoUrl,
    this.managerName,
    this.organizationName,
    this.donorCount = 0,
    this.descriptionShort,
    this.descriptionFull,
    this.targetAmount = 0,
    this.currentAmount = 0,
    this.timeStarted,
    this.timeEnded,
    this.topic,
    this.receivingInfo,
    this.managerEmail,
    this.managerUserId,
    this.managerAvatarUrl,
  });

  /// Whether the manager is a system member that can receive a connection
  /// request (i.e. their email matched a user account).
  bool get hasSystemManager => managerUserId != null;

  double get progress =>
      targetAmount <= 0 ? 0 : (currentAmount / targetAmount).clamp(0, 1);

  /// True if the campaign cannot accept donations: the end time has passed.
  bool get isClosed => timeEnded != null && timeEnded!.isBefore(DateTime.now());

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
      donorCount: (json['donorCount'] as num?)?.toInt() ?? 0,
      descriptionShort: json['descriptionShort'] as String?,
      descriptionFull: json['descriptionFull'] as String?,
      targetAmount: (json['targetAmount'] as num?)?.toDouble() ?? 0,
      currentAmount: (json['currentAmount'] as num?)?.toDouble() ?? 0,
      timeStarted: _date(json['timeStarted']),
      timeEnded: _date(json['timeEnded']),
      topic: json['topic'] as String?,
      receivingInfo:
          info is Map<String, dynamic>
              ? FundReceivingInfo.fromJson(info)
              : null,
      managerEmail: json['managerEmail'] as String?,
      managerUserId: (json['managerUserId'] as num?)?.toInt(),
      managerAvatarUrl: json['managerAvatarUrl'] as String?,
    );
  }

  static DateTime? _date(Object? v) =>
      v is String && v.isNotEmpty ? DateTime.tryParse(v) : null;
}
