import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/router/route_names.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../shared/widgets/empty_view.dart';
import '../../../../shared/widgets/error_view.dart';
import '../../../../shared/widgets/skeleton.dart';
import '../../data/models/event_ticket.dart';
import '../providers/event_provider.dart';

/// "Vé của tôi" — lists the current user's event registration tickets. Tapping
/// a ticket opens its detail. Reached from the profile "Hoạt động" section.
class MyTicketsPage extends ConsumerWidget {
  const MyTicketsPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(myTicketsProvider);

    return Scaffold(
      appBar: AppBar(title: Text('event.my_tickets'.tr())),
      body: async.when(
        loading: () => ListView(
          children: List.generate(5, (_) => const SkeletonTile()),
        ),
        error: (_, __) => ErrorView(
          message: 'event.tickets_load_failed'.tr(),
          onRetry: () => ref.invalidate(myTicketsProvider),
        ),
        data: (tickets) {
          if (tickets.isEmpty) {
            return EmptyView(
              icon: Icons.confirmation_number_outlined,
              title: 'event.no_tickets'.tr(),
              message: 'event.no_tickets_desc'.tr(),
            );
          }
          return RefreshIndicator(
            onRefresh: () async {
              ref.invalidate(myTicketsProvider);
              await ref.read(myTicketsProvider.future);
            },
            child: ListView.separated(
              padding: const EdgeInsets.all(12),
              itemCount: tickets.length,
              separatorBuilder: (_, __) => const SizedBox(height: 10),
              itemBuilder: (_, i) => _TicketCard(ticket: tickets[i]),
            ),
          );
        },
      ),
    );
  }
}

class _TicketCard extends ConsumerWidget {
  const _TicketCard({required this.ticket});
  final EventTicket ticket;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // Resolve the event title (the ticket may not embed it).
    final titleAsync = ticket.eventTitle != null
        ? AsyncValue.data(ticket.eventTitle!)
        : ref.watch(eventDetailProvider(ticket.eventId).select(
            (a) => a.whenData((e) => e.title),
          ));
    final title = titleAsync.valueOrNull ??
        'event.event_number'.tr(namedArgs: {'id': ticket.eventId.toString()});
    final date = ticket.registeredAt != null
        ? DateFormat('dd/MM/yyyy • HH:mm').format(ticket.registeredAt!)
        : '';

    return InkWell(
      borderRadius: BorderRadius.circular(12),
      onTap: () =>
          context.push(RouteNames.ticketDetail(ticket.ticketCode), extra: ticket),
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppColors.divider),
        ),
        child: Row(
          children: [
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: AppColors.primary.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(10),
              ),
              child: const Icon(Icons.confirmation_number_outlined,
                  color: AppColors.primary),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                          fontWeight: FontWeight.w700, fontSize: 15)),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      Text(
                          'event.ticket_code_label'.tr(namedArgs: {'code': ticket.ticketCode}),
                          style: const TextStyle(
                              fontSize: 12, color: AppColors.textSecondary)),
                      if (date.isNotEmpty) ...[
                        const Text(' • ',
                            style: TextStyle(
                                fontSize: 12, color: AppColors.textSecondary)),
                        Text(date,
                            style: const TextStyle(
                                fontSize: 12,
                                color: AppColors.textSecondary)),
                      ],
                    ],
                  ),
                  const SizedBox(height: 8),
                  TicketStatusBadge(ticket: ticket),
                ],
              ),
            ),
            const Icon(Icons.chevron_right, color: AppColors.textSecondary),
          ],
        ),
      ),
    );
  }
}

/// Coloured status chip for a ticket.
class TicketStatusBadge extends StatelessWidget {
  const TicketStatusBadge({super.key, required this.ticket});
  final EventTicket ticket;

  @override
  Widget build(BuildContext context) {
    final Color color;
    if (ticket.isCancelled) {
      color = AppColors.error;
    } else if (ticket.isCheckedIn) {
      color = AppColors.success;
    } else if (ticket.status.toUpperCase() == 'REJECTED') {
      color = AppColors.error;
    } else if (ticket.status.toUpperCase() == 'PENDING') {
      color = AppColors.warning;
    } else {
      color = AppColors.primary;
    }
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        ticket.statusKey.tr(),
        style: TextStyle(
            color: color, fontSize: 12, fontWeight: FontWeight.w700),
      ),
    );
  }
}
