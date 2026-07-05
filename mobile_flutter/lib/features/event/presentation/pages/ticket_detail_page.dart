import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:qr_flutter/qr_flutter.dart';

import '../../../../core/router/route_names.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../shared/widgets/app_toast.dart';
import '../../../../shared/widgets/error_view.dart';
import '../../data/models/event_ticket.dart';
import '../providers/event_provider.dart';
import 'my_tickets_page.dart';

/// Ticket detail — shows a single registration ticket: a ticket-style card with
/// the code, status, the registered event, registration answers and any
/// cancellation reason. Opened from the "Vé của tôi" list.
class TicketDetailPage extends ConsumerWidget {
  const TicketDetailPage({super.key, required this.code, this.initial});

  final String code;
  final EventTicket? initial;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // Use the passed-in ticket immediately if available; otherwise fetch.
    final async =
        initial != null
            ? AsyncValue.data(initial!)
            : ref.watch(ticketByCodeProvider(code));

    return Scaffold(
      appBar: AppBar(title: Text('event.ticket_detail_title'.tr())),
      body: async.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error:
            (_, __) => ErrorView(
              message: 'event.ticket_load_failed'.tr(),
              onRetry: () => ref.invalidate(ticketByCodeProvider(code)),
            ),
        data: (ticket) => _Body(ticket: ticket),
      ),
    );
  }
}

class _Body extends ConsumerWidget {
  const _Body({required this.ticket});
  final EventTicket ticket;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
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

    final reg =
        ticket.registeredAt != null
            ? DateFormat('dd/MM/yyyy • HH:mm').format(ticket.registeredAt!)
            : null;
    final checkin =
        ticket.checkedInAt != null
            ? DateFormat('dd/MM/yyyy • HH:mm').format(ticket.checkedInAt!)
            : null;

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        _TicketCard(code: ticket.ticketCode, badge: ticket),
        const SizedBox(height: 20),

        _SectionTitle('event.title'.tr()),
        InkWell(
          onTap: () => context.push('${RouteNames.events}/${ticket.eventId}'),
          child: Row(
            children: [
              Expanded(
                child: Text(
                  title,
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
              const Icon(Icons.chevron_right, color: AppColors.textSecondary),
            ],
          ),
        ),
        const SizedBox(height: 16),

        _SectionTitle('event.status_label'.tr()),
        TicketStatusBadge(ticket: ticket),
        const SizedBox(height: 16),

        if (reg != null) ...[
          _InfoRow(Icons.schedule, 'event.registration_time'.tr(), reg),
        ],
        if (checkin != null)
          _InfoRow(
            Icons.how_to_reg_outlined,
            'event.checkin_time'.tr(),
            checkin,
          ),

        if (ticket.isCancelled &&
            ticket.cancelReason != null &&
            ticket.cancelReason!.isNotEmpty) ...[
          const SizedBox(height: 8),
          _InfoRow(
            Icons.cancel_outlined,
            'event.cancel_reason_label'.tr(),
            ticket.cancelReason!,
            color: AppColors.error,
          ),
        ],
        if (ticket.rejectReason != null && ticket.rejectReason!.isNotEmpty)
          _InfoRow(
            Icons.block,
            'event.reject_reason_label'.tr(),
            ticket.rejectReason!,
            color: AppColors.error,
          ),

        if (ticket.registrationAnswers.isNotEmpty) ...[
          const SizedBox(height: 16),
          _SectionTitle('event.registration_info'.tr()),
          ...ticket.registrationAnswers.map(_answerTile),
        ],
      ],
    );
  }

  Widget _answerTile(Map<String, dynamic> a) {
    final label =
        (a['label'] ?? a['question'] ?? 'event.question_fallback'.tr())
            .toString();
    final value = a['value'];
    final text = value is List ? value.join(', ') : (value?.toString() ?? '');
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: const TextStyle(
              fontSize: 12,
              color: AppColors.textSecondary,
            ),
          ),
          const SizedBox(height: 2),
          Text(text.isEmpty ? '—' : text, style: const TextStyle(fontSize: 15)),
        ],
      ),
    );
  }
}

/// A ticket-stub style card with a dashed perforation and the code.
class _TicketCard extends StatelessWidget {
  const _TicketCard({required this.code, required this.badge});
  final String code;
  final EventTicket badge;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [AppColors.primary, AppColors.primaryDark],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(16),
      ),
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(
                Icons.confirmation_number,
                color: Colors.white70,
                size: 20,
              ),
              const SizedBox(width: 8),
              Text(
                'event.ticket_header'.tr(),
                style: const TextStyle(
                  color: Colors.white70,
                  fontSize: 12,
                  fontWeight: FontWeight.w700,
                  letterSpacing: 1,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          // QR rendered fully on-device (self-hosted — the code is never sent
          // to a third-party QR service). Encodes the same payload as web.
          Center(child: _QrBox(code: code, ticket: badge)),
          const SizedBox(height: 16),
          Text(
            'event.ticket_code'.tr(),
            style: const TextStyle(color: Colors.white70, fontSize: 12),
          ),
          const SizedBox(height: 4),
          Row(
            children: [
              Expanded(
                child: Text(
                  code,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 26,
                    fontWeight: FontWeight.w800,
                    letterSpacing: 2,
                  ),
                ),
              ),
              IconButton(
                tooltip: 'event.copy_code'.tr(),
                onPressed: () {
                  Clipboard.setData(ClipboardData(text: code));
                  AppToast.success(context, 'event.code_copied'.tr());
                },
                icon: const Icon(Icons.copy, color: Colors.white70, size: 20),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

/// White card containing the ticket QR. Generated locally with qr_flutter, so
/// the ticket code is never sent to an external QR service. When the ticket is
/// no longer usable (cancelled / already checked-in/used) the QR is dimmed with
/// a status overlay so it can't be mistaken for a valid pass.
class _QrBox extends StatelessWidget {
  const _QrBox({required this.code, required this.ticket});
  final String code;
  final EventTicket ticket;

  @override
  Widget build(BuildContext context) {
    final invalid = ticket.isCancelled || ticket.isCheckedIn;
    // Prefer the server-issued encrypted token; fall back to the legacy plaintext
    // format for tickets issued before QR encryption was added.
    final payload =
        (ticket.qrToken != null && ticket.qrToken!.isNotEmpty)
            ? ticket.qrToken!
            : 'ALUMVERSE-TICKET-$code';

    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Stack(
        alignment: Alignment.center,
        children: [
          QrImageView(
            data: payload,
            version: QrVersions.auto,
            size: 200,
            gapless: true,
            // ignore: deprecated_member_use
            foregroundColor:
                invalid ? Colors.grey.shade400 : AppColors.primaryDarker,
          ),
          if (invalid)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              decoration: BoxDecoration(
                color:
                    (ticket.isCancelled ? AppColors.error : AppColors.success),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                ticket.isCancelled
                    ? 'event.status_cancelled_upper'.tr()
                    : 'event.status_used_upper'.tr(),
                style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.w800,
                  fontSize: 14,
                  letterSpacing: 1,
                ),
              ),
            ),
        ],
      ),
    );
  }
}

class _SectionTitle extends StatelessWidget {
  const _SectionTitle(this.text);
  final String text;
  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Text(
        text,
        style: const TextStyle(
          fontSize: 15,
          fontWeight: FontWeight.w700,
          color: AppColors.primary,
        ),
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  const _InfoRow(this.icon, this.label, this.value, {this.color});
  final IconData icon;
  final String label;
  final String value;
  final Color? color;
  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 20, color: color ?? AppColors.textSecondary),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: const TextStyle(
                    fontSize: 12,
                    color: AppColors.textSecondary,
                  ),
                ),
                const SizedBox(height: 2),
                Text(value, style: TextStyle(fontSize: 15, color: color)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
