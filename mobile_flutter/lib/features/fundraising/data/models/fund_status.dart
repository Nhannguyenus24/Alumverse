/// A fund status option from `GET /api/fund-statuses`, used in the filter.
class FundStatus {
  final int id;
  final String name;

  const FundStatus({required this.id, required this.name});

  factory FundStatus.fromJson(Map<String, dynamic> json) {
    return FundStatus(
      id: (json['id'] as num).toInt(),
      name: json['name'] as String? ?? '',
    );
  }
}
