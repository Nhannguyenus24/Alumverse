import 'package:cached_network_image/cached_network_image.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/router/route_names.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/utils/image_url.dart';
import '../../../event/data/models/event_summary.dart';
import '../../../event/presentation/providers/event_provider.dart';
import 'section_title.dart';

/// "Sự kiện sắp tới" — live upcoming events from `/api/events/upcoming`.
/// Horizontally scrollable cards.
class EventsSection extends ConsumerWidget {
  const EventsSection({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(upcomingEventsProvider);

    return async.when(
      loading: () => const SizedBox.shrink(),
      error: (_, __) => const SizedBox.shrink(),
      data: (events) {
        if (events.isEmpty) return const SizedBox.shrink();
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            SectionTitle(
              'home.upcoming_events'.tr(),
              action: TextButton(
                onPressed: () => context.push(RouteNames.events),
                child: Text('home.view_all'.tr()),
              ),
            ),
            SizedBox(
              height: 210,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 16),
                itemCount: events.length,
                separatorBuilder: (_, __) => const SizedBox(width: 12),
                itemBuilder: (_, i) => _EventCard(event: events[i]),
              ),
            ),
          ],
        );
      },
    );
  }
}

class _EventCard extends StatelessWidget {
  const _EventCard({required this.event});

  final EventSummary event;

  @override
  Widget build(BuildContext context) {
    final banner = resolveImageUrl(event.bannerUrl);
    final date =
        event.startTime != null
            ? DateFormat('dd/MM/yyyy • HH:mm').format(event.startTime!)
            : null;

    return InkWell(
      onTap: () => context.push(RouteNames.events),
      borderRadius: BorderRadius.circular(12),
      child: Container(
        width: 260,
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppColors.divider),
        ),
        clipBehavior: Clip.antiAlias,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            SizedBox(
              height: 110,
              width: double.infinity,
              child:
                  banner != null
                      ? CachedNetworkImage(
                        imageUrl: banner,
                        fit: BoxFit.cover,
                        placeholder:
                            (_, __) => Container(color: AppColors.divider),
                        errorWidget:
                            (_, __, ___) => Container(
                              color: AppColors.primaryLighter,
                              child: const Icon(
                                Icons.event,
                                size: 36,
                                color: AppColors.primary,
                              ),
                            ),
                      )
                      : Container(
                        color: AppColors.primaryLighter,
                        child: const Center(
                          child: Icon(
                            Icons.event,
                            size: 40,
                            color: AppColors.primary,
                          ),
                        ),
                      ),
            ),
            Padding(
              padding: const EdgeInsets.all(10),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    event.title,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      fontWeight: FontWeight.w800,
                      fontSize: 14,
                    ),
                  ),
                  if (date != null) ...[
                    const SizedBox(height: 6),
                    _IconLine(icon: Icons.schedule, text: date),
                  ],
                  if (event.location != null && event.location!.isNotEmpty) ...[
                    const SizedBox(height: 4),
                    _IconLine(
                      icon: Icons.place_outlined,
                      text: event.location!,
                    ),
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
            style: const TextStyle(
              color: AppColors.textSecondary,
              fontSize: 12,
            ),
          ),
        ),
      ],
    );
  }
}
