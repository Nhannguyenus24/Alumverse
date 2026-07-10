import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/router/route_names.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../shared/widgets/app_toast.dart';
import '../../../../shared/widgets/empty_view.dart';
import '../../../../shared/widgets/error_view.dart';
import '../../../../shared/widgets/skeleton.dart';
import '../../data/models/event_ticket.dart';
import '../../data/repositories/event_repository.dart';
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
        loading:
            () => ListView(
              children: List.generate(5, (_) => const SkeletonTile()),
            ),
        error:
            (_, __) => ErrorView(
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

  Future<void> _cancelTicket(BuildContext context, WidgetRef ref) async {
    final reason = await askEventCancelReason(context);
    if (reason == null) return;
    try {
      await ref
          .read(eventRepositoryProvider)
          .cancelTicketByCode(ticket.ticketCode, reason);
      ref.invalidate(myTicketsProvider);
      ref.invalidate(ticketByCodeProvider(ticket.ticketCode));
      ref.invalidate(eventInteractionProvider(ticket.eventId));
      if (context.mounted) {
        AppToast.success(context, 'event.ticket_cancel_success'.tr());
      }
    } catch (e) {
      if (context.mounted) {
        AppToast.error(context, 'event.ticket_cancel_error'.tr());
      }
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // Resolve the event title (the ticket may not embed it).
    final titleAsync =
        ticket.eventTitle != null
            ? AsyncValue.data(ticket.eventTitle!)
            : ref.watch(
              eventDetailProvider(
                ticket.eventId,
              ).select((a) => a.whenData((e) => e.title)),
            );
    final title =
        titleAsync.valueOrNull ??
        'event.event_number'.tr(namedArgs: {'id': ticket.eventId.toString()});
    final date =
        ticket.registeredAt != null
            ? DateFormat('dd/MM/yyyy • HH:mm').format(ticket.registeredAt!)
            : '';

    return InkWell(
      borderRadius: BorderRadius.circular(12),
      onTap:
          () => context.push(
            RouteNames.ticketDetail(ticket.ticketCode),
            extra: ticket,
          ),
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
                color: AppColors.primaryLighter,
                borderRadius: BorderRadius.circular(10),
              ),
              child: const Icon(
                Icons.confirmation_number_outlined,
                color: AppColors.primary,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      fontWeight: FontWeight.w700,
                      fontSize: 15,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      Text(
                        'event.ticket_code_label'.tr(
                          namedArgs: {'code': ticket.ticketCode},
                        ),
                        style: const TextStyle(
                          fontSize: 12,
                          color: AppColors.textSecondary,
                        ),
                      ),
                      if (date.isNotEmpty) ...[
                        const Text(
                          ' • ',
                          style: TextStyle(
                            fontSize: 12,
                            color: AppColors.textSecondary,
                          ),
                        ),
                        Text(
                          date,
                          style: const TextStyle(
                            fontSize: 12,
                            color: AppColors.textSecondary,
                          ),
                        ),
                      ],
                    ],
                  ),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 8,
                    runSpacing: 6,
                    crossAxisAlignment: WrapCrossAlignment.center,
                    children: [
                      TicketStatusBadge(ticket: ticket),
                      if (ticket.canCancel)
                        TextButton.icon(
                          onPressed: () => _cancelTicket(context, ref),
                          icon: const Icon(Icons.cancel_outlined, size: 18),
                          label: Text('event.cancel_join'.tr()),
                          style: TextButton.styleFrom(
                            foregroundColor: AppColors.error,
                            padding: const EdgeInsets.symmetric(
                              horizontal: 8,
                              vertical: 4,
                            ),
                            tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                          ),
                        ),
                    ],
                  ),
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

Future<String?> askEventCancelReason(BuildContext context) {
  final controller = TextEditingController();
  final formKey = GlobalKey<FormState>();
  return showDialog<String>(
    context: context,
    builder:
        (ctx) => AlertDialog(
          title: Text('event.cancel_join'.tr()),
          content: Form(
            key: formKey,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('event.cancel_reason_prompt'.tr()),
                const SizedBox(height: 12),
                TextFormField(
                  controller: controller,
                  autofocus: true,
                  minLines: 2,
                  maxLines: 4,
                  validator:
                      (v) =>
                          (v == null || v.trim().isEmpty)
                              ? 'event.cancel_reason_required'.tr()
                              : null,
                  decoration: InputDecoration(
                    hintText: 'event.cancel_reason_hint'.tr(),
                    border: const OutlineInputBorder(),
                    isDense: true,
                  ),
                ),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: Text('common.close'.tr()),
            ),
            ElevatedButton.icon(
              onPressed: () {
                if (formKey.currentState?.validate() ?? false) {
                  Navigator.pop(ctx, controller.text.trim());
                }
              },
              style: ElevatedButton.styleFrom(backgroundColor: AppColors.error),
              icon: const Icon(Icons.cancel_outlined),
              label: Text('event.confirm_cancel'.tr()),
            ),
          ],
        ),
  );
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
          color: color,
          fontSize: 12,
          fontWeight: FontWeight.w700,
        ),
      ),
    );
  }
}
