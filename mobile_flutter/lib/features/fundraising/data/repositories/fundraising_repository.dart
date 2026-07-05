import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/constants/api_endpoints.dart';
import '../../../../core/network/dio_client.dart';
import '../models/fund_detail.dart';
import '../models/fund_donation.dart';
import '../models/fund_summary.dart';

final fundraisingRepositoryProvider = Provider<FundraisingRepository>((ref) {
  return FundraisingRepository(ref.watch(dioProvider));
});

/// A page of items from a fund paginated endpoint. The backend wraps results
/// in `data.items` with `totalItem`/`totalPage` metadata.
class FundPageResult<T> {
  final List<T> items;
  final int totalPage;
  final int totalItem;

  const FundPageResult({
    required this.items,
    required this.totalPage,
    required this.totalItem,
  });
}

/// Payload for `POST /api/fund-donations`. Note the snake_case keys
/// (`donor_member_id`, `donor_name`) — they match the backend DTO exactly.
class CreateDonationRequest {
  final int fundId;
  final int? donorMemberId; // null = anonymous / not signed in
  final String? donorName; // null = backend stores "Ẩn danh"
  final num amount; // integer VND, > 0
  final String? address;
  final String? phone;
  final String? email;
  final String? message;

  const CreateDonationRequest({
    required this.fundId,
    this.donorMemberId,
    this.donorName,
    required this.amount,
    this.address,
    this.phone,
    this.email,
    this.message,
  });

  Map<String, dynamic> toJson() => {
    'fundId': fundId,
    'donor_member_id': donorMemberId,
    'donor_name': donorName,
    'amount': amount,
    'address': address,
    'phone': phone,
    'email': email,
    'message': message,
  };
}

class FundraisingRepository {
  FundraisingRepository(this._dio);

  final Dio _dio;

  /// Browse campaigns with optional search / filters.
  Future<FundPageResult<FundSummary>> getFunds({
    int page = 0,
    int limit = 10,
    String? q,
    int? organizationId,
    num? targetAmountMin,
    num? targetAmountMax,
    DateTime? timeStartedFrom,
    DateTime? timeStartedTo,
  }) async {
    final res = await _dio.get(
      ApiEndpoints.funds,
      queryParameters: {
        'page': page,
        'limit': limit,
        if (q != null && q.isNotEmpty) 'q': q,
        if (organizationId != null) 'organizationId': organizationId,
        if (targetAmountMin != null) 'targetAmountMin': targetAmountMin,
        if (targetAmountMax != null) 'targetAmountMax': targetAmountMax,
        if (timeStartedFrom != null)
          'timeStartedFrom': _isoStartOfDay(timeStartedFrom),
        if (timeStartedTo != null) 'timeStartedTo': _isoEndOfDay(timeStartedTo),
      },
    );
    return _pageResult(res.data, FundSummary.fromJson);
  }

  Future<FundDetail> getFundDetail(int id) async {
    final res = await _dio.get(ApiEndpoints.fundDetail(id));
    return FundDetail.fromJson(_dataMap(res.data));
  }

  /// Creates a donation and returns the SePay checkout URL (a QR image URL).
  Future<String> createDonation(CreateDonationRequest request) async {
    final res = await _dio.post(
      ApiEndpoints.fundDonations,
      data: request.toJson(),
    );
    final data = _dataMap(res.data);
    return data['checkoutUrl'] as String? ?? '';
  }

  /// The signed-in user's own donation history.
  Future<FundPageResult<FundDonation>> getMyDonations({
    required int userId,
    int page = 0,
    int limit = 20,
  }) async {
    final res = await _dio.get(
      ApiEndpoints.fundDonationsByUser(userId),
      queryParameters: {'page': page, 'limit': limit},
    );
    return _pageResult(res.data, FundDonation.fromJson);
  }

  // ── helpers ────────────────────────────────────────────────────────────────

  String _isoStartOfDay(DateTime d) => '${_ymd(d)}T00:00:00';

  String _isoEndOfDay(DateTime d) => '${_ymd(d)}T23:59:59';

  String _ymd(DateTime d) =>
      '${d.year.toString().padLeft(4, '0')}-'
      '${d.month.toString().padLeft(2, '0')}-'
      '${d.day.toString().padLeft(2, '0')}';

  Map<String, dynamic> _dataMap(dynamic body) {
    var data = body is Map ? body['data'] : body;
    // Unwrap the `{ data: {...}, warnings: [...] }` envelope if present.
    if (data is Map && data['data'] is Map && data.containsKey('warnings')) {
      data = data['data'];
    }
    return data is Map<String, dynamic> ? data : <String, dynamic>{};
  }

  FundPageResult<T> _pageResult<T>(
    dynamic body,
    T Function(Map<String, dynamic>) fromJson,
  ) {
    var data = body is Map ? body['data'] : body;
    // Some endpoints wrap the page one level deeper: `data.data.items`
    // (the outer object only carries `warnings`). Descend if needed.
    if (data is Map &&
        data['items'] == null &&
        data['content'] == null &&
        data['data'] is Map) {
      data = data['data'];
    }
    final map = data is Map<String, dynamic> ? data : <String, dynamic>{};
    final raw = map['items'] ?? map['content'];
    final items =
        raw is List
            ? raw.map((e) => fromJson(e as Map<String, dynamic>)).toList()
            : <T>[];
    return FundPageResult<T>(
      items: items,
      totalPage: (map['totalPage'] as num?)?.toInt() ?? 1,
      totalItem: (map['totalItem'] as num?)?.toInt() ?? items.length,
    );
  }
}
