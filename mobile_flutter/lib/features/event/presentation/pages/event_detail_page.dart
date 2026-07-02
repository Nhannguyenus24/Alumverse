import 'package:cached_network_image/cached_network_image.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_widget_from_html_core/flutter_widget_from_html_core.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/router/route_names.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/utils/image_url.dart';
import '../../../../shared/widgets/app_toast.dart';
import '../../../../shared/widgets/error_view.dart';
import '../../../auth/presentation/providers/auth_provider.dart';
import '../../data/models/event_summary.dart';
import '../../data/repositories/event_repository.dart';
import '../providers/event_provider.dart';
import '../widgets/event_register_sheet.dart';

/// Event detail + interactions — native port of the web event detail
/// (ArticlePage event view): banner, info, HTML description, stats, and the
/// "Quan tâm" (interest/notify) + "Tham gia" (register) actions.
class EventDetailPage extends ConsumerWidget {
  const EventDetailPage({super.key, required this.eventId});

  final int eventId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final detailAsync = ref.watch(eventDetailProvider(eventId));

    final isStaff = ref.watch(isStaffProvider);

    return Scaffold(
      appBar: AppBar(
        title: Text('event.detail_title'.tr()),
        actions: [
          if (isStaff)
            IconButton(
              icon: const Icon(Icons.admin_panel_settings_outlined),
              tooltip: 'event.manage_btn'.tr(),
              onPressed: () =>
                  context.push(RouteNames.adminEventManage(eventId)),
            ),
        ],
      ),
      body: detailAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (_, __) => ErrorView(
          message: 'event.load_failed'.tr(),
          onRetry: () => ref.invalidate(eventDetailProvider(eventId)),
        ),
        data: (event) => _DetailBody(event: event),
      ),
    );
  }
}

class _DetailBody extends ConsumerWidget {
  const _DetailBody({required this.event});

  final EventSummary event;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final banner = resolveImageUrl(event.bannerUrl);
    final interaction = ref.watch(eventInteractionProvider(event.id));
    final df = DateFormat('dd/MM/yyyy • HH:mm');

    return ListView(
      padding: EdgeInsets.zero,
      children: [
        if (banner != null)
          CachedNetworkImage(
            imageUrl: banner,
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
              if (event.topic != null && event.topic!.isNotEmpty)
                Text(event.topic!.toUpperCase(),
                    style: const TextStyle(
                        color: AppColors.primary,
                        fontWeight: FontWeight.w700,
                        fontSize: 12,
                        letterSpacing: 0.5)),
              const SizedBox(height: 6),
              Text(event.title,
                  style: const TextStyle(
                      fontSize: 22, fontWeight: FontWeight.bold, height: 1.3)),
              const SizedBox(height: 12),
              if (event.startTime != null)
                _InfoLine(
                  Icons.schedule,
                  () {
                    final start = df.format(event.startTime!);
                    return event.endTime != null
                        ? '$start → ${df.format(event.endTime!)}'
                        : start;
                  }(),
                  label: 'event.time_label'.tr(),
                ),
              if (event.registrationEndAt != null)
                _InfoLine(
                  Icons.event_available_outlined,
                  df.format(event.registrationEndAt!),
                  label: 'event.registration_deadline'.tr(),
                ),
              if (event.location != null && event.location!.isNotEmpty)
                _InfoLine(Icons.place_outlined, event.location!,
                    label: 'event.location'.tr()),
              if (event.organizer != null && event.organizer!.isNotEmpty)
                _InfoLine(Icons.groups_outlined, event.organizer!,
                    label: 'event.organizer_label'.tr()),

              // Stats (live from interaction provider, fallback to summary).
              const SizedBox(height: 8),
              interaction.when(
                loading: () => _StatsRow(
                  interested: event.interestedCount,
                  registered: event.joinedCount,
                  capacity: event.maxCapacity,
                ),
                error: (_, __) => _StatsRow(
                  interested: event.interestedCount,
                  registered: event.joinedCount,
                  capacity: event.maxCapacity,
                ),
                data: (s) => _StatsRow(
                  interested: s.interestedCount,
                  registered: s.registeredCount,
                  capacity: event.maxCapacity,
                ),
              ),

              const Divider(height: 28),
              if (event.description != null && event.description!.isNotEmpty)
                HtmlWidget(
                  event.description!,
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
                ),
              const SizedBox(height: 24),
              if (!ref.watch(isStaffProvider))
                _Actions(eventId: event.id, eventTitle: event.title),
            ],
          ),
        ),
      ],
    );
  }
}

class _Actions extends ConsumerStatefulWidget {
  const _Actions({required this.eventId, required this.eventTitle});
  final int eventId;
  final String eventTitle;

  @override
  ConsumerState<_Actions> createState() => _ActionsState();
}

class _ActionsState extends ConsumerState<_Actions> {
  bool _busyInterest = false;
  bool _busyRegister = false;

  EventInteractionNotifier get _notifier =>
      ref.read(eventInteractionProvider(widget.eventId).notifier);

  Future<void> _toggleInterest(bool currentlyInterested) async {
    setState(() => _busyInterest = true);
    try {
      if (currentlyInterested) {
        await _notifier.removeInterest();
      } else {
        await _notifier.addInterest();
      }
    } catch (_) {
      // The notifier swallows benign state-mismatch errors (409/404) and
      // resyncs; only unexpected failures land here.
      if (mounted) AppToast.error(context, 'common.error'.tr());
    } finally {
      if (mounted) setState(() => _busyInterest = false);
    }
  }

  /// Entry point for the "Tham gia" button. Loads the event's registration
  /// questions: if there are none, show a simple confirm dialog; if there are,
  /// open a form to answer them. Then register with the collected answers.
  Future<void> _onRegisterPressed() async {
    setState(() => _busyRegister = true);
    final repo = ref.read(eventRepositoryProvider);
    try {
      final questions = await repo.getQuestions(widget.eventId);
      if (!mounted) return;

      List<Map<String, dynamic>>? answers;
      if (questions.isEmpty) {
        final ok = await showDialog<bool>(
          context: context,
          builder: (ctx) => AlertDialog(
            title: Text('event.join_event_title'.tr()),
            content: Text(
                'event.join_confirm_message'.tr(namedArgs: {'title': widget.eventTitle})),
            actions: [
              TextButton(
                  onPressed: () => Navigator.pop(ctx, false),
                  child: Text('common.cancel'.tr())),
              ElevatedButton(
                  onPressed: () => Navigator.pop(ctx, true),
                  child: Text('event.join'.tr())),
            ],
          ),
        );
        if (ok != true) {
          if (mounted) setState(() => _busyRegister = false);
          return;
        }
      } else {
        answers = await EventRegisterSheet.show(
          context,
          eventTitle: widget.eventTitle,
          questions: questions,
        );
        if (answers == null) {
          // user dismissed the form
          if (mounted) setState(() => _busyRegister = false);
          return;
        }
      }

      await _notifier.register(answers);
      if (mounted) AppToast.success(context, 'event.register_success'.tr());
    } catch (e) {
      if (mounted) {
        AppToast.error(context, 'event.register_failed'.tr());
      }
    } finally {
      if (mounted) setState(() => _busyRegister = false);
    }
  }

  /// "Hủy tham gia": require a reason, then cancel the ticket.
  Future<void> _onCancelPressed() async {
    final reason = await _askCancelReason();
    if (reason == null) return; // dismissed
    setState(() => _busyRegister = true);
    try {
      await _notifier.cancelRegistration(reason);
      if (mounted) AppToast.success(context, 'event.cancel_success'.tr());
    } catch (e) {
      if (mounted) AppToast.error(context, 'event.cancel_failed'.tr());
    } finally {
      if (mounted) setState(() => _busyRegister = false);
    }
  }

  /// Prompts for a (required) cancellation reason. Returns the trimmed reason,
  /// or null if dismissed.
  Future<String?> _askCancelReason() {
    final controller = TextEditingController();
    final formKey = GlobalKey<FormState>();
    return showDialog<String>(
      context: context,
      builder: (ctx) => AlertDialog(
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
                validator: (v) => (v == null || v.trim().isEmpty)
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
              child: Text('common.close'.tr())),
          ElevatedButton(
            onPressed: () {
              if (formKey.currentState?.validate() ?? false) {
                Navigator.pop(ctx, controller.text.trim());
              }
            },
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.error),
            child: Text('event.confirm_cancel'.tr()),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final interaction = ref.watch(eventInteractionProvider(widget.eventId));
    final interested = interaction.valueOrNull?.interested ?? false;
    final registered = interaction.valueOrNull?.registered ?? false;

    return Row(
      children: [
        Expanded(
          child: OutlinedButton.icon(
            onPressed: _busyInterest ? null : () => _toggleInterest(interested),
            icon: Icon(interested ? Icons.notifications_active : Icons.notifications_none),
            label: Text(interested ? 'event.already_interested'.tr() : 'event.interested'.tr()),
            style: OutlinedButton.styleFrom(
              padding: const EdgeInsets.symmetric(vertical: 14),
              foregroundColor:
                  interested ? AppColors.primary : AppColors.textSecondary,
            ),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: registered
              ? OutlinedButton.icon(
                  onPressed: _busyRegister ? null : _onCancelPressed,
                  icon: const Icon(Icons.cancel_outlined),
                  label: Text('event.cancel_join'.tr()),
                  style: OutlinedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    foregroundColor: AppColors.error,
                    side: const BorderSide(color: AppColors.error),
                  ),
                )
              : ElevatedButton.icon(
                  onPressed: _busyRegister ? null : _onRegisterPressed,
                  icon: const Icon(Icons.event_available),
                  label: Text('event.join'.tr()),
                  style: ElevatedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 14),
                  ),
                ),
        ),
      ],
    );
  }
}

class _InfoLine extends StatelessWidget {
  const _InfoLine(this.icon, this.text, {this.label});
  final IconData icon;
  final String text;

  /// Optional caption shown above the value (e.g. "Thời gian diễn ra").
  final String? label;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 5),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 18, color: AppColors.primary),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (label != null)
                  Text(label!,
                      style: const TextStyle(
                          fontSize: 11, color: AppColors.textSecondary)),
                Text(text,
                    style: TextStyle(
                      color: AppColors.textPrimary,
                      fontWeight:
                          label != null ? FontWeight.w600 : FontWeight.w400,
                    )),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _StatsRow extends StatelessWidget {
  const _StatsRow({
    required this.interested,
    required this.registered,
    this.capacity,
  });

  final int interested;
  final int registered;
  final int? capacity;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(top: 4),
      child: Row(
        children: [
          _stat('event.interested'.tr(), '$interested'),
          const SizedBox(width: 24),
          _stat('event.registered'.tr(),
              capacity != null ? '$registered/$capacity' : '$registered'),
        ],
      ),
    );
  }

  Widget _stat(String label, String value) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label,
            style: const TextStyle(
                fontSize: 11, color: AppColors.textSecondary)),
        Text(value,
            style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 16)),
      ],
    );
  }
}
