import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../auth/presentation/providers/auth_provider.dart';
import '../../../organization/presentation/providers/organization_provider.dart';
import '../../data/models/fund_detail.dart';
import '../../data/models/fund_donation.dart';
import '../../data/models/fund_status.dart';
import '../../data/models/fund_summary.dart';
import '../../data/repositories/fundraising_repository.dart';

/// Number of campaigns shown per page.
const int kFundPageSize = 3;

/// Search + filter + page state for the fund list.
class FundQuery {
  final String q;
  final String? statusId;
  final int? amountMin;
  final int? amountMax;
  final DateTime? dateFrom;
  final DateTime? dateTo;
  final int page; // 0-based

  const FundQuery({
    this.q = '',
    this.statusId,
    this.amountMin,
    this.amountMax,
    this.dateFrom,
    this.dateTo,
    this.page = 0,
  });

  /// Whether any filter (excluding the free-text search) is active.
  bool get hasActiveFilters =>
      statusId != null ||
      amountMin != null ||
      amountMax != null ||
      dateFrom != null ||
      dateTo != null;

  FundQuery copyWith({
    String? q,
    String? statusId,
    int? amountMin,
    int? amountMax,
    DateTime? dateFrom,
    DateTime? dateTo,
    int? page,
    bool clearStatus = false,
    bool clearAmountMin = false,
    bool clearAmountMax = false,
    bool clearDateFrom = false,
    bool clearDateTo = false,
  }) {
    return FundQuery(
      q: q ?? this.q,
      statusId: clearStatus ? null : (statusId ?? this.statusId),
      amountMin: clearAmountMin ? null : (amountMin ?? this.amountMin),
      amountMax: clearAmountMax ? null : (amountMax ?? this.amountMax),
      dateFrom: clearDateFrom ? null : (dateFrom ?? this.dateFrom),
      dateTo: clearDateTo ? null : (dateTo ?? this.dateTo),
      page: page ?? this.page,
    );
  }
}

final fundQueryProvider = StateProvider<FundQuery>((ref) => const FundQuery());

/// Status options for the filter dropdown.
final fundStatusesProvider = FutureProvider<List<FundStatus>>((ref) {
  return ref.watch(fundraisingRepositoryProvider).getFundStatuses();
});

/// Paginated list of campaigns, reactive to [fundQueryProvider]. Scoped to the
/// currently selected organization (matches the web client).
final fundsProvider = FutureProvider<FundPageResult<FundSummary>>((ref) {
  final q = ref.watch(fundQueryProvider);
  final orgId = ref.watch(organizationStateProvider).valueOrNull?.id;
  return ref.watch(fundraisingRepositoryProvider).getFunds(
        page: q.page,
        limit: kFundPageSize,
        q: q.q,
        organizationId: orgId,
        statusId: q.statusId != null ? int.tryParse(q.statusId!) : null,
        targetAmountMin: q.amountMin,
        targetAmountMax: q.amountMax,
        timeStartedFrom: q.dateFrom,
        timeStartedTo: q.dateTo,
      );
});

/// Full detail for one campaign.
final fundDetailProvider = FutureProvider.family<FundDetail, int>((ref, id) {
  return ref.read(fundraisingRepositoryProvider).getFundDetail(id);
});

/// The signed-in user's donation history. Empty when signed out.
final myDonationsProvider =
    FutureProvider<FundPageResult<FundDonation>>((ref) async {
  final rawId = ref.watch(authStateProvider).valueOrNull?.user?.id;
  final userId = rawId != null ? int.tryParse(rawId) : null;
  if (userId == null) {
    return const FundPageResult<FundDonation>(
        items: [], totalPage: 1, totalItem: 0);
  }
  return ref
      .read(fundraisingRepositoryProvider)
      .getMyDonations(userId: userId, page: 0, limit: 30);
});
