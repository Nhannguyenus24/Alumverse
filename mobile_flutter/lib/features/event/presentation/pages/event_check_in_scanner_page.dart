import 'package:dio/dio.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile_scanner/mobile_scanner.dart';

import '../../../../core/errors/api_exception.dart';
import '../../../../core/theme/app_colors.dart';
import '../../data/models/event_ticket.dart';
import '../../data/repositories/event_repository.dart';

/// Prefix the app embeds in the ticket QR (`MyTicketCard` / `qr_flutter`). A
/// generic camera app yields the full string, so we strip it before lookup.
const _qrPrefix = 'ALUMVERSE-TICKET-';

enum _ResultKind { success, warning, error }

class _CheckInResult {
  const _CheckInResult(this.kind, this.message, {this.ticket});
  final _ResultKind kind;
  final String message;
  final EventTicket? ticket;
}

/// Per-event QR check-in scanner for admins/staff. Validates each scanned
/// ticket belongs to [eventId], then calls the check-in endpoint. Includes a
/// manual code-entry fallback for damaged or unreadable QR codes.
class EventCheckInScannerPage extends ConsumerStatefulWidget {
  const EventCheckInScannerPage({
    super.key,
    required this.eventId,
    this.eventTitle,
  });

  final int eventId;
  final String? eventTitle;

  @override
  ConsumerState<EventCheckInScannerPage> createState() =>
      _EventCheckInScannerPageState();
}

class _EventCheckInScannerPageState
    extends ConsumerState<EventCheckInScannerPage> {
  final MobileScannerController _controller = MobileScannerController(
    detectionSpeed: DetectionSpeed.noDuplicates,
  );

  // True while a code is being verified or its result sheet is open — pauses
  // detection so one QR is processed exactly once.
  bool _busy = false;
  bool _torchOn = false;

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  /// Strip the app QR prefix (if present) and normalise to the stored format.
  String _normalize(String raw) {
    var s = raw.trim();
    if (s.toUpperCase().startsWith(_qrPrefix)) {
      s = s.substring(_qrPrefix.length);
    }
    return s.trim().toUpperCase();
  }

  void _onDetect(BarcodeCapture capture) {
    if (_busy) return;
    String? raw;
    for (final b in capture.barcodes) {
      if (b.rawValue != null && b.rawValue!.isNotEmpty) {
        raw = b.rawValue;
        break;
      }
    }
    if (raw == null) return;
    _handleCode(_normalize(raw));
  }

  Future<void> _handleCode(String code) async {
    if (code.isEmpty || _busy) return;
    setState(() => _busy = true);
    await _controller.stop();

    final result = await _checkIn(code);
    if (!mounted) return;
    await _showResult(result);

    if (!mounted) return;
    // Resume scanning for the next attendee.
    await _controller.start();
    if (mounted) setState(() => _busy = false);
  }

  Future<_CheckInResult> _checkIn(String code) async {
    final repo = ref.read(eventRepositoryProvider);
    try {
      final ticket = await repo.getTicketByCode(code);
      if (ticket.eventId != widget.eventId) {
        return _CheckInResult(
            _ResultKind.error, 'event.checkin_wrong_event'.tr(),
            ticket: ticket);
      }
      if (ticket.isCancelled) {
        return _CheckInResult(
            _ResultKind.error, 'event.checkin_cancelled'.tr(),
            ticket: ticket);
      }
      if (ticket.isCheckedIn) {
        return _CheckInResult(
            _ResultKind.warning, 'event.checkin_already'.tr(),
            ticket: ticket);
      }
      final updated = await repo.checkInTicket(code);
      return _CheckInResult(
          _ResultKind.success, 'event.checkin_success'.tr(),
          ticket: updated);
    } catch (e) {
      return _CheckInResult(_ResultKind.error, _messageOf(e));
    }
  }

  String _messageOf(Object e) {
    if (e is DioException) {
      final inner = e.error;
      if (inner is ApiException) return inner.message;
      return 'event.checkin_not_found'.tr();
    }
    if (e is ApiException) return e.message;
    return 'event.checkin_not_found'.tr();
  }

  Future<void> _showResult(_CheckInResult result) {
    return showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppColors.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => _ResultSheet(
        result: result,
        onClose: () => Navigator.of(ctx).pop(),
      ),
    );
  }

  Future<void> _promptManualEntry() async {
    final controller = TextEditingController();
    final code = await showDialog<String>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text('event.checkin_manual_title'.tr()),
        content: TextField(
          controller: controller,
          autofocus: true,
          textCapitalization: TextCapitalization.characters,
          decoration: InputDecoration(
            labelText: 'event.ticket_code'.tr(),
            hintText: 'ABC12345',
          ),
          onSubmitted: (v) => Navigator.of(ctx).pop(v),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: Text('common.cancel'.tr()),
          ),
          ElevatedButton(
            onPressed: () => Navigator.of(ctx).pop(controller.text),
            child: Text('event.check_in'.tr()),
          ),
        ],
      ),
    );
    if (code != null && code.trim().isNotEmpty) {
      await _handleCode(_normalize(code));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        title: Text(widget.eventTitle ?? 'event.checkin_title'.tr()),
        actions: [
          IconButton(
            tooltip: 'event.checkin_torch'.tr(),
            icon: Icon(_torchOn ? Icons.flash_on : Icons.flash_off),
            onPressed: () async {
              await _controller.toggleTorch();
              if (mounted) setState(() => _torchOn = !_torchOn);
            },
          ),
          IconButton(
            tooltip: 'event.checkin_switch_camera'.tr(),
            icon: const Icon(Icons.cameraswitch_outlined),
            onPressed: () => _controller.switchCamera(),
          ),
        ],
      ),
      body: Stack(
        children: [
          MobileScanner(
            controller: _controller,
            onDetect: _onDetect,
            errorBuilder: (context, error, child) => Center(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Text(
                  'event.checkin_camera_error'.tr(),
                  textAlign: TextAlign.center,
                  style: const TextStyle(color: Colors.white),
                ),
              ),
            ),
          ),
          // Scan window guide.
          IgnorePointer(
            child: Center(
              child: Container(
                width: 240,
                height: 240,
                decoration: BoxDecoration(
                  border: Border.all(color: Colors.white, width: 3),
                  borderRadius: BorderRadius.circular(16),
                ),
              ),
            ),
          ),
          if (_busy)
            Container(
              color: Colors.black54,
              child: const Center(
                child: CircularProgressIndicator(color: Colors.white),
              ),
            ),
          Positioned(
            left: 0,
            right: 0,
            bottom: 0,
            child: Container(
              color: Colors.black.withValues(alpha: 0.55),
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 28),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    'event.checkin_hint'.tr(),
                    textAlign: TextAlign.center,
                    style: const TextStyle(color: Colors.white),
                  ),
                  const SizedBox(height: 12),
                  OutlinedButton.icon(
                    onPressed: _busy ? null : _promptManualEntry,
                    icon: const Icon(Icons.keyboard_outlined,
                        color: Colors.white),
                    label: Text(
                      'event.checkin_manual_entry'.tr(),
                      style: const TextStyle(color: Colors.white),
                    ),
                    style: OutlinedButton.styleFrom(
                      side: const BorderSide(color: Colors.white54),
                      padding: const EdgeInsets.symmetric(
                          horizontal: 20, vertical: 12),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _ResultSheet extends StatelessWidget {
  const _ResultSheet({required this.result, required this.onClose});

  final _CheckInResult result;
  final VoidCallback onClose;

  Color get _color => switch (result.kind) {
        _ResultKind.success => AppColors.success,
        _ResultKind.warning => AppColors.warning,
        _ResultKind.error => AppColors.error,
      };

  IconData get _icon => switch (result.kind) {
        _ResultKind.success => Icons.check_circle,
        _ResultKind.warning => Icons.info,
        _ResultKind.error => Icons.cancel,
      };

  @override
  Widget build(BuildContext context) {
    final ticket = result.ticket;
    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(20, 20, 20, 24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Icon(_icon, color: _color, size: 56),
            const SizedBox(height: 12),
            Text(
              result.message,
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 17,
                fontWeight: FontWeight.w700,
                color: _color,
              ),
            ),
            if (ticket != null) ...[
              const SizedBox(height: 16),
              if (ticket.attendeeLabel != null)
                _InfoRow(
                  icon: Icons.person_outline,
                  label: 'event.checkin_attendee'.tr(),
                  value: ticket.attendeeLabel!,
                ),
              _InfoRow(
                icon: Icons.confirmation_number_outlined,
                label: 'event.ticket_code'.tr(),
                value: ticket.ticketCode,
              ),
              _InfoRow(
                icon: Icons.flag_outlined,
                label: 'event.checkin_status'.tr(),
                value: ticket.statusKey.tr(),
              ),
            ],
            const SizedBox(height: 20),
            ElevatedButton(
              onPressed: onClose,
              style: ElevatedButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 14),
              ),
              child: Text('event.checkin_scan_next'.tr()),
            ),
          ],
        ),
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  const _InfoRow({
    required this.icon,
    required this.label,
    required this.value,
  });

  final IconData icon;
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 18, color: AppColors.textSecondary),
          const SizedBox(width: 10),
          Text('$label: ',
              style: const TextStyle(color: AppColors.textSecondary)),
          Expanded(
            child: Text(value,
                style: const TextStyle(fontWeight: FontWeight.w600)),
          ),
        ],
      ),
    );
  }
}
