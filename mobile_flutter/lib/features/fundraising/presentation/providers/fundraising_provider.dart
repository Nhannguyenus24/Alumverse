import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../auth/presentation/providers/auth_provider.dart';
import '../../../organization/presentation/providers/organization_provider.dart';
import '../../data/models/fund_detail.dart';
import '../../data/models/fund_donation.dart';
import '../../data/models/fund_summary.dart';
import '../../data/repositories/fundraising_repository.dart';

/// Number of campaigns shown per page.
const int kFundPageSize = 3;

/// Search + filter + page state for the fund list.
class FundQuery {
  final String q;
  final int? amountMin;
  final int? amountMax;
  final DateTime? dateFrom;
  final DateTime? dateTo;
  final int page; // 0-based

  const FundQuery({
    this.q = '',
    this.amountMin,
    this.amountMax,
    this.dateFrom,
    this.dateTo,
    this.page = 0,
  });

  /// Whether any filter (excluding the free-text search) is active.
  bool get hasActiveFilters =>
      amountMin != null ||
      amountMax != null ||
      dateFrom != null ||
      dateTo != null;

  FundQuery copyWith({
    String? q,
    int? amountMin,
    int? amountMax,
    DateTime? dateFrom,
    DateTime? dateTo,
    int? page,
    bool clearAmountMin = false,
    bool clearAmountMax = false,
    bool clearDateFrom = false,
    bool clearDateTo = false,
  }) {
    return FundQuery(
      q: q ?? this.q,
      amountMin: clearAmountMin ? null : (amountMin ?? this.amountMin),
      amountMax: clearAmountMax ? null : (amountMax ?? this.amountMax),
      dateFrom: clearDateFrom ? null : (dateFrom ?? this.dateFrom),
      dateTo: clearDateTo ? null : (dateTo ?? this.dateTo),
      page: page ?? this.page,
    );
  }
}

final fundQueryProvider = StateProvider<FundQuery>((ref) => const FundQuery());

/// Paginated list of campaigns, reactive to [fundQueryProvider]. Scoped to the
/// currently selected organization (matches the web client).
///
/// `autoDispose` so the list is refetched each time the page is reopened rather
/// than served from stale in-memory data (the filter/search state lives in the
/// separate [fundQueryProvider], which is preserved).
final fundsProvider = FutureProvider.autoDispose<FundPageResult<FundSummary>>((
  ref,
) {
  final q = ref.watch(fundQueryProvider);
  final orgId = ref.watch(organizationStateProvider).valueOrNull?.id;
  return ref
      .watch(fundraisingRepositoryProvider)
      .getFunds(
        page: q.page,
        limit: kFundPageSize,
        q: q.q,
        organizationId: orgId,
        targetAmountMin: q.amountMin,
        targetAmountMax: q.amountMax,
        timeStartedFrom: q.dateFrom,
        timeStartedTo: q.dateTo,
      );
});

/// Full detail for one campaign.
///
/// `autoDispose` so the cached detail is dropped once the user leaves the page:
/// re-opening a fund always refetches from the API instead of showing stale
/// in-memory data.
final fundDetailProvider = FutureProvider.autoDispose.family<FundDetail, int>((
  ref,
  id,
) {
  return ref.read(fundraisingRepositoryProvider).getFundDetail(id);
});

/// The signed-in user's donation history. Empty when signed out.
///
/// `autoDispose` so the history is refetched on each visit instead of showing a
/// cached snapshot (e.g. after making a new donation elsewhere).
final myDonationsProvider =
    FutureProvider.autoDispose<FundPageResult<FundDonation>>((ref) async {
      final rawId = ref.watch(authStateProvider).valueOrNull?.user?.id;
      final userId = rawId != null ? int.tryParse(rawId) : null;
      if (userId == null) {
        return const FundPageResult<FundDonation>(
          items: [],
          totalPage: 1,
          totalItem: 0,
        );
      }
      return ref
          .read(fundraisingRepositoryProvider)
          .getMyDonations(userId: userId, page: 0, limit: 30);
    });
