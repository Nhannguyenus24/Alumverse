import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../../../../core/router/route_names.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/utils/currency.dart';
import '../../../../core/utils/image_url.dart';
import '../../../../shared/widgets/empty_view.dart';
import '../../../../shared/widgets/error_view.dart';
import '../../../../shared/widgets/skeleton.dart';
import '../../data/models/fund_summary.dart';
import '../providers/fundraising_provider.dart';
import '../widgets/fund_filter_sheet.dart';

/// Fundraising campaigns list — native port of the web `DonationPage`.
/// Free-text search (triggered from the keyboard), a filter sheet, and
/// page-by-page navigation (3 campaigns per page).
class FundraisingListPage extends ConsumerStatefulWidget {
  const FundraisingListPage({super.key});

  @override
  ConsumerState<FundraisingListPage> createState() =>
      _FundraisingListPageState();
}

class _FundraisingListPageState extends ConsumerState<FundraisingListPage> {
  final _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _searchController.text = ref.read(fundQueryProvider).q;
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  void _submitSearch(String value) {
    final notifier = ref.read(fundQueryProvider.notifier);
    notifier.state = notifier.state.copyWith(q: value.trim(), page: 0);
  }

  Future<void> _openFilters() async {
    final current = ref.read(fundQueryProvider);
    final result = await showModalBottomSheet<FundQuery>(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppColors.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (_) => FundFilterSheet(initial: current),
    );
    if (result != null) {
      ref.read(fundQueryProvider.notifier).state = result;
    }
  }

  void _goToPage(int page) {
    final notifier = ref.read(fundQueryProvider.notifier);
    notifier.state = notifier.state.copyWith(page: page);
  }

  @override
  Widget build(BuildContext context) {
    final query = ref.watch(fundQueryProvider);
    final fundsAsync = ref.watch(fundsProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Đóng góp & Quỹ')),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _searchController,
                    textInputAction: TextInputAction.search,
                    onSubmitted: _submitSearch,
                    decoration: InputDecoration(
                      hintText: 'Tìm kiếm quỹ...',
                      prefixIcon: const Icon(Icons.search),
                      isDense: true,
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                Badge(
                  isLabelVisible: query.hasActiveFilters,
                  smallSize: 8,
                  child: IconButton.filledTonal(
                    onPressed: _openFilters,
                    tooltip: 'Bộ lọc',
                    icon: const Icon(Icons.tune),
                  ),
                ),
              ],
            ),
          ),
          Expanded(
            child: RefreshIndicator(
              onRefresh: () async {
                ref.invalidate(fundsProvider);
                await ref.read(fundsProvider.future);
              },
              child: fundsAsync.when(
                loading: () => const SkeletonList(count: 3),
                error: (_, __) => ListView(
                  children: [
                    const SizedBox(height: 80),
                    ErrorView(
                      message: 'Không tải được danh sách quỹ',
                      onRetry: () => ref.invalidate(fundsProvider),
                    ),
                  ],
                ),
                data: (page) {
                  final funds = page.items;
                  if (funds.isEmpty) {
                    return ListView(
                      children: const [
                        SizedBox(height: 80),
                        EmptyView(
                          icon: Icons.volunteer_activism_outlined,
                          title: 'Không có quỹ phù hợp',
                          message:
                              'Thử thay đổi từ khóa hoặc bộ lọc tìm kiếm.',
                        ),
                      ],
                    );
                  }
                  return ListView(
                    padding: const EdgeInsets.all(16),
                    children: [
                      for (var i = 0; i < funds.length; i++)
                        Padding(
                          padding: const EdgeInsets.only(bottom: 16),
                          child: _FundCard(fund: funds[i])
                              .animate()
                              .fadeIn(duration: 250.ms, delay: (i * 60).ms)
                              .slideY(begin: 0.06, curve: Curves.easeOut),
                        ),
                      _Pagination(
                        currentPage: query.page,
                        totalPage: page.totalPage,
                        onChanged: _goToPage,
                      ),
                      const SizedBox(height: 16),
                    ],
                  );
                },
              ),
            ),
          ),
        ],
      ),
    );
  }
}

String _dateRange(FundSummary f) {
  final df = DateFormat('dd/MM/yyyy');
  if (f.timeStarted == null && f.timeEnded == null) return '';
  final start = f.timeStarted != null ? df.format(f.timeStarted!) : '?';
  final end = f.timeEnded != null ? df.format(f.timeEnded!) : '?';
  return '$start → $end';
}

class _FundCard extends StatelessWidget {
  const _FundCard({required this.fund});

  final FundSummary fund;

  @override
  Widget build(BuildContext context) {
    final logo = resolveImageUrl(fund.logoUrl);
    final range = _dateRange(fund);

    return InkWell(
      onTap: () => context.push('${RouteNames.fundraising}/${fund.id}'),
      borderRadius: BorderRadius.circular(14),
      child: Container(
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: AppColors.divider),
        ),
        clipBehavior: Clip.antiAlias,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            AspectRatio(
              aspectRatio: 16 / 9,
              child: logo != null
                  ? CachedNetworkImage(
                      imageUrl: logo,
                      fit: BoxFit.cover,
                      placeholder: (_, __) =>
                          Container(color: AppColors.divider),
                      errorWidget: (_, __, ___) => const _FundFallback(),
                    )
                  : const _FundFallback(),
            ),
            Padding(
              padding: const EdgeInsets.all(14),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    fund.name,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                        fontWeight: FontWeight.bold, fontSize: 17),
                  ),
                  if (fund.managerName != null &&
                      fund.managerName!.isNotEmpty) ...[
                    const SizedBox(height: 6),
                    _IconLine(
                        icon: Icons.person_outline, text: fund.managerName!),
                  ],
                  const SizedBox(height: 10),
                  _FundProgress(fund: fund),
                  const SizedBox(height: 10),
                  Row(
                    children: [
                      Expanded(
                        child: _IconLine(
                            icon: Icons.favorite_border,
                            text: '${fund.donorCount} người ủng hộ'),
                      ),
                      if (range.isNotEmpty)
                        Expanded(
                          child: _IconLine(
                              icon: Icons.event_outlined, text: range),
                        ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Raised / target line + progress bar.
class _FundProgress extends StatelessWidget {
  const _FundProgress({required this.fund});

  final FundSummary fund;

  @override
  Widget build(BuildContext context) {
    final pct = (fund.progress * 100).round();
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        ClipRRect(
          borderRadius: BorderRadius.circular(4),
          child: LinearProgressIndicator(
            value: fund.progress,
            minHeight: 7,
            backgroundColor: AppColors.divider,
            valueColor: const AlwaysStoppedAnimation(AppColors.primary),
          ),
        ),
        const SizedBox(height: 5),
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Flexible(
              child: Text(
                formatVnd(fund.currentAmount),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                    fontWeight: FontWeight.w700,
                    fontSize: 13.5,
                    color: AppColors.primary),
              ),
            ),
            Text('$pct%',
                style: const TextStyle(
                    fontSize: 12, color: AppColors.textSecondary)),
          ],
        ),
        Text(
          'Mục tiêu ${formatVnd(fund.targetAmount)}',
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
          style:
              const TextStyle(fontSize: 11.5, color: AppColors.textSecondary),
        ),
      ],
    );
  }
}

/// Prev / "Trang X/Y" / Next controls. Hidden when there is a single page.
class _Pagination extends StatelessWidget {
  const _Pagination({
    required this.currentPage,
    required this.totalPage,
    required this.onChanged,
  });

  final int currentPage; // 0-based
  final int totalPage;
  final ValueChanged<int> onChanged;

  @override
  Widget build(BuildContext context) {
    if (totalPage <= 1) return const SizedBox.shrink();
    final canPrev = currentPage > 0;
    final canNext = currentPage < totalPage - 1;
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        IconButton.outlined(
          onPressed: canPrev ? () => onChanged(currentPage - 1) : null,
          icon: const Icon(Icons.chevron_left),
        ),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Text(
            'Trang ${currentPage + 1}/$totalPage',
            style: const TextStyle(fontWeight: FontWeight.w600),
          ),
        ),
        IconButton.outlined(
          onPressed: canNext ? () => onChanged(currentPage + 1) : null,
          icon: const Icon(Icons.chevron_right),
        ),
      ],
    );
  }
}

class _FundFallback extends StatelessWidget {
  const _FundFallback();

  @override
  Widget build(BuildContext context) {
    return Container(
      color: AppColors.primary.withValues(alpha: 0.08),
      child: const Center(
        child: Icon(Icons.volunteer_activism,
            size: 40, color: AppColors.primary),
      ),
    );
  }
}

class _IconLine extends StatelessWidget {
  const _IconLine({required this.icon, required this.text});

  final IconData icon;
  final String text;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon, size: 13, color: AppColors.textSecondary),
        const SizedBox(width: 4),
        Expanded(
          child: Text(
            text,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style:
                const TextStyle(color: AppColors.textSecondary, fontSize: 12),
          ),
        ),
      ],
    );
  }
}
