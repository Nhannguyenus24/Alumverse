import 'package:cached_network_image/cached_network_image.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import 'package:flutter_animate/flutter_animate.dart';

import '../../../../core/router/route_names.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/utils/image_url.dart';
import '../../../../shared/widgets/empty_view.dart';
import '../../../../shared/widgets/error_view.dart';
import '../../../../shared/widgets/skeleton.dart';
import '../../data/models/event_summary.dart';
import '../providers/event_provider.dart';

/// Events & seminars list — native port of the web `ActivitiesEventsPage`.
/// Featured upcoming event + "Sắp diễn ra" + "Đã diễn ra" grids.
class EventsPage extends ConsumerWidget {
  const EventsPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final upcomingAsync = ref.watch(allUpcomingEventsProvider);
    final pastAsync = ref.watch(pastEventsProvider);

    return Scaffold(
      appBar: AppBar(title: Text('event.title'.tr())),
      body: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(allUpcomingEventsProvider);
          ref.invalidate(pastEventsProvider);
          await ref.read(allUpcomingEventsProvider.future);
        },
        child: upcomingAsync.when(
          loading: () => const SkeletonList(count: 3),
          error: (_, __) => ErrorView(
            message: 'event.load_failed'.tr(),
            onRetry: () => ref.invalidate(allUpcomingEventsProvider),
          ),
          data: (upcoming) {
            final featured = upcoming.isNotEmpty ? upcoming.first : null;
            final rest = upcoming.length > 1 ? upcoming.sublist(1) : <EventSummary>[];
            final past = pastAsync.valueOrNull ?? const <EventSummary>[];

            return ListView(
              padding: const EdgeInsets.all(16),
              children: [
                Text(
                  'event.title_upper'.tr(),
                  style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                        fontWeight: FontWeight.w800,
                        color: AppColors.primary,
                      ),
                ),
                const SizedBox(height: 16),
                if (featured != null)
                  _FeaturedEventCard(event: featured)
                      .animate()
                      .fadeIn(duration: 300.ms)
                      .slideY(begin: 0.08, curve: Curves.easeOut),
                if (rest.isNotEmpty) ...[
                  const SizedBox(height: 24),
                  _SectionHeader('event.upcoming'.tr()),
                  const SizedBox(height: 12),
                  _EventGrid(events: rest),
                ],
                if (past.isNotEmpty) ...[
                  const SizedBox(height: 24),
                  _SectionHeader('event.past'.tr()),
                  const SizedBox(height: 12),
                  _EventGrid(events: past),
                ],
                if (featured == null && past.isEmpty)
                  Padding(
                    padding: const EdgeInsets.symmetric(vertical: 40),
                    child: EmptyView(
                      icon: Icons.event_busy_outlined,
                      title: 'event.no_events'.tr(),
                      message: 'event.no_events_desc'.tr(),
                    ),
                  ),
                const SizedBox(height: 24),
              ],
            );
          },
        ),
      ),
    );
  }
}

class _SectionHeader extends StatelessWidget {
  const _SectionHeader(this.text);

  final String text;

  @override
  Widget build(BuildContext context) {
    return Text(
      text,
      style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700),
    );
  }
}

class _EventGrid extends StatelessWidget {
  const _EventGrid({required this.events});

  final List<EventSummary> events;

  @override
  Widget build(BuildContext context) {
    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: events.length,
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        mainAxisSpacing: 12,
        crossAxisSpacing: 12,
        childAspectRatio: 0.72,
      ),
      itemBuilder: (_, i) => _EventCard(event: events[i]),
    );
  }
}

class _EventCard extends StatelessWidget {
  const _EventCard({required this.event});

  final EventSummary event;

  @override
  Widget build(BuildContext context) {
    final banner = resolveImageUrl(event.bannerUrl);
    final date = event.startTime != null
        ? DateFormat('dd/MM/yyyy • HH:mm').format(event.startTime!)
        : null;

    return InkWell(
      onTap: () => context.push('${RouteNames.events}/${event.id}'),
      borderRadius: BorderRadius.circular(12),
      child: Container(
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppColors.divider),
        ),
        clipBehavior: Clip.antiAlias,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            AspectRatio(
              aspectRatio: 16 / 10,
              child: banner != null
                  ? CachedNetworkImage(
                      imageUrl: banner,
                      fit: BoxFit.cover,
                      placeholder: (_, __) => Container(color: AppColors.divider),
                      errorWidget: (_, __, ___) => const _EventFallback(),
                    )
                  : const _EventFallback(),
            ),
            Expanded(
              child: Padding(
                padding: const EdgeInsets.all(10),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      event.title,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                          fontWeight: FontWeight.w600, fontSize: 13.5),
                    ),
                    const Spacer(),
                    if (date != null)
                      _IconLine(icon: Icons.schedule, text: date),
                    if (event.location != null && event.location!.isNotEmpty)
                      Padding(
                        padding: const EdgeInsets.only(top: 3),
                        child: _IconLine(
                            icon: Icons.place_outlined, text: event.location!),
                      ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _FeaturedEventCard extends StatelessWidget {
  const _FeaturedEventCard({required this.event});

  final EventSummary event;

  @override
  Widget build(BuildContext context) {
    final banner = resolveImageUrl(event.bannerUrl);
    final date = event.startTime != null
        ? DateFormat('dd/MM/yyyy • HH:mm').format(event.startTime!)
        : null;

    return InkWell(
      onTap: () => context.push('${RouteNames.events}/${event.id}'),
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
              child: banner != null
                  ? CachedNetworkImage(
                      imageUrl: banner,
                      fit: BoxFit.cover,
                      placeholder: (_, __) => Container(color: AppColors.divider),
                      errorWidget: (_, __, ___) => const _EventFallback(),
                    )
                  : const _EventFallback(),
            ),
            Padding(
              padding: const EdgeInsets.all(14),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    event.title,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                        fontWeight: FontWeight.bold, fontSize: 18),
                  ),
                  if (date != null) ...[
                    const SizedBox(height: 8),
                    _IconLine(icon: Icons.schedule, text: date),
                  ],
                  if (event.location != null && event.location!.isNotEmpty) ...[
                    const SizedBox(height: 4),
                    _IconLine(
                        icon: Icons.place_outlined, text: event.location!),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _EventFallback extends StatelessWidget {
  const _EventFallback();

  @override
  Widget build(BuildContext context) {
    return Container(
      color: AppColors.primary.withValues(alpha: 0.08),
      child: const Center(
        child: Icon(Icons.event, size: 40, color: AppColors.primary),
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
            style: const TextStyle(color: AppColors.textSecondary, fontSize: 12),
          ),
        ),
      ],
    );
  }
}
