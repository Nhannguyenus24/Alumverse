import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_widget_from_html_core/flutter_widget_from_html_core.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../../../../core/router/route_names.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/utils/currency.dart';
import '../../../../core/utils/image_url.dart';
import '../../../../shared/widgets/error_view.dart';
import '../../data/models/fund_detail.dart';
import '../providers/fundraising_provider.dart';

/// Fundraising campaign detail — native port of the web `DonationArticlePage`:
/// logo, progress panel, HTML description, and a "Đóng góp" CTA.
class FundraisingDetailPage extends ConsumerWidget {
  const FundraisingDetailPage({super.key, required this.fundId});

  final int fundId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final detailAsync = ref.watch(fundDetailProvider(fundId));

    return Scaffold(
      appBar: AppBar(title: const Text('Chi tiết quỹ')),
      body: detailAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (_, __) => ErrorView(
          message: 'Không tải được thông tin quỹ',
          onRetry: () => ref.invalidate(fundDetailProvider(fundId)),
        ),
        data: (fund) => _DetailBody(fund: fund),
      ),
    );
  }
}

class _DetailBody extends StatelessWidget {
  const _DetailBody({required this.fund});

  final FundDetail fund;

  @override
  Widget build(BuildContext context) {
    final logo = resolveImageUrl(fund.logoUrl);
    final closed = fund.isClosed;

    return Column(
      children: [
        Expanded(
          child: ListView(
            padding: EdgeInsets.zero,
            children: [
              if (logo != null)
                CachedNetworkImage(
                  imageUrl: logo,
                  height: 200,
                  width: double.infinity,
                  fit: BoxFit.cover,
                  placeholder: (_, __) =>
                      Container(height: 200, color: AppColors.divider),
                  errorWidget: (_, __, ___) =>
                      Container(height: 200, color: AppColors.divider),
                ),
              Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    if (fund.topic != null && fund.topic!.isNotEmpty)
                      Text(fund.topic!.toUpperCase(),
                          style: const TextStyle(
                              color: AppColors.primary,
                              fontWeight: FontWeight.w700,
                              fontSize: 12,
                              letterSpacing: 0.5)),
                    const SizedBox(height: 6),
                    Text(fund.name,
                        style: const TextStyle(
                            fontSize: 22,
                            fontWeight: FontWeight.bold,
                            height: 1.3)),
                    const SizedBox(height: 14),
                    _ProgressPanel(fund: fund),
                    const Divider(height: 28),
                    if (fund.descriptionFull != null &&
                        fund.descriptionFull!.isNotEmpty)
                      HtmlWidget(
                        fund.descriptionFull!,
                        textStyle: const TextStyle(fontSize: 15, height: 1.6),
                        customWidgetBuilder: (el) {
                          if (el.localName != 'img') return null;
                          final src = resolveImageUrl(el.attributes['src']);
                          if (src == null) return const SizedBox.shrink();
                          return Padding(
                            padding: const EdgeInsets.symmetric(vertical: 8),
                            child: CachedNetworkImage(
                                imageUrl: src, fit: BoxFit.contain),
                          );
                        },
                      )
                    else if (fund.descriptionShort != null)
                      Text(fund.descriptionShort!,
                          style: const TextStyle(fontSize: 15, height: 1.6)),
                    const SizedBox(height: 16),
                  ],
                ),
              ),
            ],
          ),
        ),
        _DonateBar(fund: fund, closed: closed),
      ],
    );
  }
}

class _ProgressPanel extends StatelessWidget {
  const _ProgressPanel({required this.fund});

  final FundDetail fund;

  @override
  Widget build(BuildContext context) {
    final df = DateFormat('dd/MM/yyyy');
    final pct = (fund.progress * 100).round();

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.primary.withValues(alpha: 0.05),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.divider),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Đã quyên góp',
                        style: TextStyle(
                            fontSize: 12,
                            color: AppColors.textSecondary)),
                    Text(formatVnd(fund.currentAmount),
                        style: const TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.w800,
                            color: AppColors.primary)),
                  ],
                ),
              ),
              Text('$pct%',
                  style: const TextStyle(
                      fontSize: 16, fontWeight: FontWeight.w700)),
            ],
          ),
          const SizedBox(height: 8),
          ClipRRect(
            borderRadius: BorderRadius.circular(5),
            child: LinearProgressIndicator(
              value: fund.progress,
              minHeight: 8,
              backgroundColor: AppColors.divider,
              valueColor: const AlwaysStoppedAnimation(AppColors.primary),
            ),
          ),
          const SizedBox(height: 6),
          Text('Mục tiêu ${formatVnd(fund.targetAmount)}',
              style: TextStyle(
                  fontSize: 12.5, color: AppColors.textSecondary)),
          const Divider(height: 24),
          _row(Icons.favorite_border, 'Số người ủng hộ',
              '${fund.donorCount}'),
          _row(Icons.payments_outlined, 'Trung bình mỗi lượt',
              formatVnd(fund.averageDonation)),
          if (fund.managerName != null && fund.managerName!.isNotEmpty)
            _row(Icons.person_outline, 'Người phụ trách', fund.managerName!),
          if (fund.timeStarted != null)
            _row(Icons.play_circle_outline, 'Bắt đầu',
                df.format(fund.timeStarted!)),
          if (fund.timeEnded != null)
            _row(Icons.stop_circle_outlined, 'Kết thúc',
                df.format(fund.timeEnded!)),
        ],
      ),
    );
  }

  Widget _row(IconData icon, String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        children: [
          Icon(icon, size: 16, color: AppColors.textSecondary),
          const SizedBox(width: 8),
          Text(label,
              style: TextStyle(color: AppColors.textSecondary, fontSize: 13)),
          const Spacer(),
          Flexible(
            child: Text(value,
                textAlign: TextAlign.right,
                style: const TextStyle(
                    fontWeight: FontWeight.w600, fontSize: 13.5)),
          ),
        ],
      ),
    );
  }
}

class _DonateBar extends StatelessWidget {
  const _DonateBar({required this.fund, required this.closed});

  final FundDetail fund;
  final bool closed;

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      top: false,
      child: Padding(
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 12),
        child: SizedBox(
          width: double.infinity,
          child: ElevatedButton.icon(
            onPressed: closed
                ? null
                : () => context
                    .push('${RouteNames.fundraising}/${fund.id}/donate'),
            icon: const Icon(Icons.volunteer_activism),
            label: Text(closed ? 'Quỹ đã kết thúc' : 'Đóng góp'),
            style: ElevatedButton.styleFrom(
              padding: const EdgeInsets.symmetric(vertical: 16),
              textStyle:
                  const TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
            ),
          ),
        ),
      ),
    );
  }
}
