import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../../core/router/route_names.dart';
import '../../../../../core/theme/app_colors.dart';
import '../../../../../shared/widgets/app_toast.dart';
import '../../data/models/connection_status.dart';
import '../../data/repositories/network_repository.dart';

/// Shows a bottom sheet for sending a first-contact message or reporting
/// the current connection status (port of web `NetworkMessageDrawer`).
///
/// Rules (per plan Mục 4/Sub-feature 5):
///  - null     → can send one message
///  - PENDING  → blocked, waiting for reply
///  - ACCEPTED → navigate to /chat
///  - REJECTED + cooldown remaining → locked, show countdown
///  - REJECTED + cooldown expired   → can send one more message
///
/// [title] and [contextNote] enable the "connect" variant (used by the
/// fundraising fund-manager contact flow, mirroring web `variant="connect"`):
/// [title] overrides the header text and [contextNote] renders an info banner
/// at the top explaining the interaction. Both default to `null` = the original
/// network behavior, so existing call sites are unaffected.
Future<void> showMessageRequestSheet(
  BuildContext context, {
  required int targetMemberId,
  required String targetName,
  String? title,
  String? contextNote,
}) {
  return showModalBottomSheet(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    builder: (_) => _MessageRequestSheet(
      targetMemberId: targetMemberId,
      targetName: targetName,
      title: title,
      contextNote: contextNote,
    ),
  );
}

class _MessageRequestSheet extends ConsumerStatefulWidget {
  const _MessageRequestSheet({
    required this.targetMemberId,
    required this.targetName,
    this.title,
    this.contextNote,
  });

  final int targetMemberId;
  final String targetName;
  final String? title;
  final String? contextNote;

  @override
  ConsumerState<_MessageRequestSheet> createState() =>
      _MessageRequestSheetState();
}

class _MessageRequestSheetState extends ConsumerState<_MessageRequestSheet> {
  final _ctrl = TextEditingController();
  ConnectionStatus? _status;
  bool _loadingStatus = true;
  bool _sending = false;
  bool _sentThisSession = false;

  @override
  void initState() {
    super.initState();
    _loadStatus();
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  Future<void> _loadStatus() async {
    try {
      final status = await ref
          .read(networkRepositoryProvider)
          .getConnectionStatus(widget.targetMemberId);
      if (mounted) {
        setState(() {
          _status = status;
          _loadingStatus = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _loadingStatus = false);
    }
  }

  Future<void> _send() async {
    final msg = _ctrl.text.trim();
    if (msg.isEmpty) return;
    setState(() => _sending = true);
    try {
      await ref
          .read(networkRepositoryProvider)
          .sendConnectionRequest(
              targetMemberId: widget.targetMemberId, message: msg);
      if (mounted) {
        setState(() {
          _sending = false;
          _sentThisSession = true;
        });
        AppToast.success(context, 'network.connection_request_sent'.tr());
      }
    } catch (e) {
      if (mounted) {
        setState(() => _sending = false);
        AppToast.fromError(context, e);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    // The "connect" variant carries an extra context banner, so it needs a
    // taller initial size for the composer + send button to be visible.
    final initialSize = widget.contextNote != null ? 0.62 : 0.5;
    return DraggableScrollableSheet(
      initialChildSize: initialSize,
      minChildSize: 0.35,
      maxChildSize: 0.9,
      builder: (_, scrollCtrl) => Container(
        decoration: const BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
        ),
        child: Column(
          children: [
            const SizedBox(height: 8),
            Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: AppColors.divider,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            Padding(
              padding:
                  const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
              child: Row(
                children: [
                  Expanded(
                    child: Text(
                      widget.title ??
                          'network.message_to'
                              .tr(namedArgs: {'name': widget.targetName}),
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: AppColors.textPrimary,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close,
                        color: AppColors.textSecondary),
                    onPressed: () => Navigator.of(context).pop(),
                  ),
                ],
              ),
            ),
            const Divider(height: 1, color: AppColors.divider),
            Expanded(
              child: SingleChildScrollView(
                controller: scrollCtrl,
                padding: EdgeInsets.only(
                  left: 16,
                  right: 16,
                  top: 16,
                  // Clear the keyboard when open, plus the home-indicator inset
                  // so the send button is never tucked under the gesture bar.
                  bottom: MediaQuery.of(context).viewInsets.bottom +
                      MediaQuery.of(context).padding.bottom +
                      16,
                ),
                child: _loadingStatus
                    ? const Center(child: CircularProgressIndicator())
                    : Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          if (widget.contextNote != null) ...[
                            _buildContextNote(widget.contextNote!),
                            const SizedBox(height: 16),
                          ],
                          _buildContent(),
                        ],
                      ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildContent() {
    if (_status == null || _status!.isNull) {
      return _buildComposer(
        banner: 'network.send_first_message_banner'.tr(),
        enabled: !_sentThisSession,
        lockedHint: _sentThisSession
            ? 'network.message_sent_hint'.tr()
            : null,
      );
    }

    if (_status!.isPending) {
      return _buildBanner(
        icon: Icons.hourglass_top_rounded,
        color: AppColors.warning,
        text: 'network.waiting_reply_banner'.tr(namedArgs: {'name': widget.targetName}),
      );
    }

    if (_status!.isAccepted) {
      return _buildAccepted();
    }

    if (_status!.isRejected) {
      if (!_status!.cooldownExpired) {
        final until = _formatCooldown(_status!.cooldownUntil);
        return _buildBanner(
          icon: Icons.lock_clock_rounded,
          color: AppColors.error,
          text: 'network.cooldown_banner'.tr(namedArgs: {'until': until}),
        );
      }
      return _buildComposer(
        banner: 'network.resend_banner'.tr(),
        enabled: !_sentThisSession,
        lockedHint: _sentThisSession
            ? 'network.message_sent_hint'.tr()
            : null,
      );
    }

    return const SizedBox.shrink();
  }

  Widget _buildComposer({
    required String banner,
    required bool enabled,
    String? lockedHint,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: AppColors.primaryLighter,
            borderRadius: BorderRadius.circular(8),
          ),
          child: Row(
            children: [
              const Icon(Icons.info_outline,
                  color: AppColors.primary, size: 18),
              const SizedBox(width: 8),
              Expanded(
                child: Text(banner,
                    style: const TextStyle(
                        color: AppColors.primary, fontSize: 13)),
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),
        if (lockedHint != null) ...[
          Text(lockedHint,
              style: const TextStyle(
                  color: AppColors.textSecondary, fontSize: 13)),
        ] else ...[
          TextField(
            controller: _ctrl,
            maxLines: 4,
            maxLength: 500,
            enabled: enabled,
            decoration: InputDecoration(
              hintText: 'network.message_hint'.tr(),
              hintStyle:
                  const TextStyle(color: AppColors.textSecondary),
              filled: true,
              fillColor: AppColors.background,
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10),
                borderSide: const BorderSide(color: AppColors.divider),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10),
                borderSide: const BorderSide(color: AppColors.divider),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10),
                borderSide: const BorderSide(color: AppColors.primary),
              ),
            ),
          ),
          const SizedBox(height: 12),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: _sending ? null : _send,
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 14),
              ),
              child: _sending
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(
                          strokeWidth: 2,
                          valueColor:
                              AlwaysStoppedAnimation(Colors.white)))
                  : Text('network.send_message_btn'.tr(),
                      style: const TextStyle(fontWeight: FontWeight.w600)),
            ),
          ),
        ],
      ],
    );
  }

  /// Info banner shown at the top of the sheet in the "connect" variant to
  /// clarify the interaction (e.g. "this is a connection request, not instant
  /// chat"). Reuses the composer's primary-tinted style.
  Widget _buildContextNote(String text) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppColors.primaryLighter,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Icon(Icons.info_outline, color: AppColors.primary, size: 18),
          const SizedBox(width: 8),
          Expanded(
            child: Text(text,
                style: const TextStyle(
                    color: AppColors.primary, fontSize: 13, height: 1.4)),
          ),
        ],
      ),
    );
  }

  Widget _buildBanner({
    required IconData icon,
    required Color color,
    required String text,
  }) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: color.withValues(alpha: 0.3)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: color, size: 24),
          const SizedBox(width: 12),
          Expanded(
            child: Text(text,
                style: TextStyle(color: color, fontSize: 14, height: 1.4)),
          ),
        ],
      ),
    );
  }

  Widget _buildAccepted() {
    return Column(
      children: [
        _buildBanner(
          icon: Icons.check_circle_outline,
          color: AppColors.success,
          text: 'network.accepted_banner'.tr(),
        ),
        const SizedBox(height: 16),
        SizedBox(
          width: double.infinity,
          child: ElevatedButton.icon(
            onPressed: () {
              Navigator.of(context).pop();
              context.go(RouteNames.chat);
            },
            icon: const Icon(Icons.chat_rounded),
            label: Text('network.open_inbox'.tr()),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primary,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(vertical: 14),
            ),
          ),
        ),
      ],
    );
  }

  String _formatCooldown(String? iso) {
    if (iso == null) return '';
    try {
      final dt = DateTime.parse(iso).toLocal();
      return '${dt.hour.toString().padLeft(2, '0')}:'
          '${dt.minute.toString().padLeft(2, '0')} '
          '${dt.day.toString().padLeft(2, '0')}/'
          '${dt.month.toString().padLeft(2, '0')}/'
          '${dt.year}';
    } catch (_) {
      return iso;
    }
  }
}
