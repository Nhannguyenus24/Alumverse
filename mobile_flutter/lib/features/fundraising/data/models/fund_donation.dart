/// A single donation record (the backend `FundDonationListItemResponse`).
/// Used for the signed-in user's own donation history.
class FundDonation {
  final int id;
  final int? fundId;
  final int? donorMemberId;
  final String? donorName;
  final double amount;
  final String? address;
  final String? phone;
  final String? email;
  final String? message;
  final String? status; // PENDING | SUCCESS | FAILED
  final DateTime? createdAt;
  final String? avatarUrl;

  const FundDonation({
    required this.id,
    this.fundId,
    this.donorMemberId,
    this.donorName,
    this.amount = 0,
    this.address,
    this.phone,
    this.email,
    this.message,
    this.status,
    this.createdAt,
    this.avatarUrl,
  });

  factory FundDonation.fromJson(Map<String, dynamic> json) {
    return FundDonation(
      id: (json['id'] as num).toInt(),
      fundId: (json['fundId'] as num?)?.toInt(),
      donorMemberId: (json['donorMemberId'] as num?)?.toInt(),
      donorName: json['donorName'] as String?,
      amount: (json['amount'] as num?)?.toDouble() ?? 0,
      address: json['address'] as String?,
      phone: json['phone'] as String?,
      email: json['email'] as String?,
      message: json['message'] as String?,
      status: json['status'] as String?,
      createdAt: _date(json['createdAt']),
      avatarUrl: json['avatarUrl'] as String?,
    );
  }

  static DateTime? _date(Object? v) =>
      v is String && v.isNotEmpty ? DateTime.tryParse(v) : null;
}
