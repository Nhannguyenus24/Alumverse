import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/utils/currency.dart';
import '../../../../shared/widgets/empty_view.dart';
import '../../../../shared/widgets/error_view.dart';
import '../../../../shared/widgets/skeleton.dart';
import '../../data/models/fund_donation.dart';
import '../providers/fundraising_provider.dart';

/// The signed-in user's donation history — native port of the web
/// "Lịch sử đóng góp" (useUserDonations).
class MyDonationsPage extends ConsumerWidget {
  const MyDonationsPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(myDonationsProvider);

    return Scaffold(
      appBar: AppBar(title: Text('donation.my_donations'.tr())),
      body: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(myDonationsProvider);
          await ref.read(myDonationsProvider.future);
        },
        child: async.when(
          loading: () => const SkeletonList(count: 5),
          error: (_, __) => ListView(
            children: [
              const SizedBox(height: 80),
              ErrorView(
                message: 'donation.history_load_failed'.tr(),
                onRetry: () => ref.invalidate(myDonationsProvider),
              ),
            ],
          ),
          data: (page) {
            if (page.items.isEmpty) {
              return ListView(
                children: [
                  const SizedBox(height: 80),
                  EmptyView(
                    icon: Icons.receipt_long_outlined,
                    title: 'donation.no_history'.tr(),
                    message: 'donation.no_history_desc'.tr(),
                  ),
                ],
              );
            }
            return ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: page.items.length,
              separatorBuilder: (_, __) => const SizedBox(height: 10),
              itemBuilder: (_, i) => _DonationCard(donation: page.items[i]),
            );
          },
        ),
      ),
    );
  }
}

class _DonationCard extends StatelessWidget {
  const _DonationCard({required this.donation});

  final FundDonation donation;

  @override
  Widget build(BuildContext context) {
    final df = DateFormat('dd/MM/yyyy • HH:mm');
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.divider),
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(formatVnd(donation.amount),
                    style: const TextStyle(
                        fontWeight: FontWeight.w800,
                        fontSize: 16,
                        color: AppColors.primary)),
                if (donation.message != null &&
                    donation.message!.isNotEmpty) ...[
                  const SizedBox(height: 4),
                  Text(donation.message!,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(fontSize: 13)),
                ],
                if (donation.createdAt != null) ...[
                  const SizedBox(height: 4),
                  Text(df.format(donation.createdAt!),
                      style: TextStyle(
                          fontSize: 11.5, color: AppColors.textSecondary)),
                ],
              ],
            ),
          ),
          const SizedBox(width: 12),
          _StatusChip(status: donation.status),
        ],
      ),
    );
  }
}

class _StatusChip extends StatelessWidget {
  const _StatusChip({required this.status});

  final String? status;

  @override
  Widget build(BuildContext context) {
    final (label, color) = switch (status?.toUpperCase()) {
      'SUCCESS' => ('donation.status_success'.tr(), AppColors.success),
      'FAILED' => ('donation.status_failed'.tr(), AppColors.error),
      _ => ('donation.status_processing'.tr(), AppColors.warning),
    };
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(label,
          style: TextStyle(
              color: color, fontSize: 12, fontWeight: FontWeight.w600)),
    );
  }
}
