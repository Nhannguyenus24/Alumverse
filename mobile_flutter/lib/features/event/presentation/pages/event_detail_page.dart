import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_widget_from_html_core/flutter_widget_from_html_core.dart';
import 'package:intl/intl.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/utils/image_url.dart';
import '../../../../shared/widgets/app_toast.dart';
import '../../../../shared/widgets/error_view.dart';
import '../../data/models/event_summary.dart';
import '../../data/repositories/event_repository.dart';
import '../providers/event_provider.dart';

/// Event detail + interactions — native port of the web event detail
/// (ArticlePage event view): banner, info, HTML description, stats, and the
/// "Quan tâm" (interest/notify) + "Tham gia" (register) actions.
class EventDetailPage extends ConsumerWidget {
  const EventDetailPage({super.key, required this.eventId});

  final int eventId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final detailAsync = ref.watch(eventDetailProvider(eventId));

    return Scaffold(
      appBar: AppBar(title: const Text('Chi tiết sự kiện')),
      body: detailAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (_, __) => ErrorView(
          message: 'Không tải được sự kiện',
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
                _InfoLine(Icons.schedule, () {
                  final start = df.format(event.startTime!);
                  return event.endTime != null
                      ? '$start → ${df.format(event.endTime!)}'
                      : start;
                }()),
              if (event.location != null && event.location!.isNotEmpty)
                _InfoLine(Icons.place_outlined, event.location!),
              if (event.organizer != null && event.organizer!.isNotEmpty)
                _InfoLine(Icons.groups_outlined, event.organizer!),

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
              _Actions(eventId: event.id),
            ],
          ),
        ),
      ],
    );
  }
}

class _Actions extends ConsumerStatefulWidget {
  const _Actions({required this.eventId});
  final int eventId;

  @override
  ConsumerState<_Actions> createState() => _ActionsState();
}

class _ActionsState extends ConsumerState<_Actions> {
  bool _busyInterest = false;
  bool _busyRegister = false;

  Future<void> _toggleInterest(bool currentlyInterested) async {
    setState(() => _busyInterest = true);
    try {
      final repo = ref.read(eventRepositoryProvider);
      if (currentlyInterested) {
        await repo.removeInterest(widget.eventId);
      } else {
        await repo.addInterest(widget.eventId);
      }
      ref.invalidate(eventInteractionProvider(widget.eventId));
    } catch (_) {
      if (mounted) AppToast.error(context, 'Thao tác thất bại.');
    } finally {
      if (mounted) setState(() => _busyInterest = false);
    }
  }

  Future<void> _register() async {
    setState(() => _busyRegister = true);
    try {
      await ref.read(eventRepositoryProvider).register(widget.eventId);
      ref.invalidate(eventInteractionProvider(widget.eventId));
      if (mounted) AppToast.success(context, 'Đăng ký tham gia thành công.');
    } catch (e) {
      if (mounted) {
        AppToast.error(context, 'Đăng ký thất bại (có thể bạn đã đăng ký).');
      }
    } finally {
      if (mounted) setState(() => _busyRegister = false);
    }
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
            label: Text(interested ? 'Đã quan tâm' : 'Quan tâm'),
            style: OutlinedButton.styleFrom(
              padding: const EdgeInsets.symmetric(vertical: 14),
              foregroundColor:
                  interested ? AppColors.primary : AppColors.textSecondary,
            ),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: ElevatedButton.icon(
            onPressed: (_busyRegister || registered) ? null : _register,
            icon: Icon(registered ? Icons.check_circle : Icons.event_available),
            label: Text(registered ? 'Đã tham gia' : 'Tham gia'),
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
  const _InfoLine(this.icon, this.text);
  final IconData icon;
  final String text;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 3),
      child: Row(
        children: [
          Icon(icon, size: 16, color: AppColors.textSecondary),
          const SizedBox(width: 8),
          Expanded(
            child: Text(text,
                style: const TextStyle(color: AppColors.textSecondary)),
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
          _stat('Quan tâm', '$interested'),
          const SizedBox(width: 24),
          _stat('Đã đăng ký',
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
