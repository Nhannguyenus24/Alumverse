import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/router/route_names.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../shared/widgets/empty_view.dart';
import '../../../../shared/widgets/error_view.dart';
import '../../../../shared/widgets/skeleton.dart';
import '../../../organization/presentation/providers/organization_provider.dart';
import '../../../user/presentation/providers/user_providers.dart';
import '../../data/models/event_summary.dart';
import '../providers/event_provider.dart';

/// Admin/staff entry point for QR check-in: pick the organization's event, then
/// open the per-event scanner. Tickets are validated against the chosen event,
/// mirroring the web `AdminEventOrganizePage` check-in flow.
class AdminCheckInEventsPage extends ConsumerWidget {
  const AdminCheckInEventsPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final canCheckInAsync = ref.watch(canEventCheckInProvider);
    final canCheckIn = canCheckInAsync.valueOrNull ?? false;
    final orgId = ref.watch(organizationStateProvider).valueOrNull?.id;

    return Scaffold(
      appBar: AppBar(title: Text('event.checkin_pick_event'.tr())),
      body:
          canCheckInAsync.isLoading
              ? const Center(child: CircularProgressIndicator())
              : !canCheckIn
              ? EmptyView(
                icon: Icons.lock_outline,
                title: 'event.checkin_forbidden'.tr(),
                message: 'event.checkin_forbidden_desc'.tr(),
              )
              : orgId == null
              ? EmptyView(
                icon: Icons.apartment_outlined,
                title: 'event.checkin_no_org'.tr(),
              )
              : _EventPicker(organizationId: orgId),
    );
  }
}

class _EventPicker extends ConsumerWidget {
  const _EventPicker({required this.organizationId});

  final int organizationId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final eventsAsync = ref.watch(adminCheckInEventsProvider(organizationId));

    return RefreshIndicator(
      onRefresh: () async {
        ref.invalidate(adminCheckInEventsProvider(organizationId));
        await ref.read(adminCheckInEventsProvider(organizationId).future);
      },
      child: eventsAsync.when(
        loading: () => const SkeletonList(count: 5),
        error:
            (_, __) => ListView(
              children: [
                const SizedBox(height: 120),
                ErrorView(
                  message: 'event.load_failed'.tr(),
                  onRetry:
                      () => ref.invalidate(
                        adminCheckInEventsProvider(organizationId),
                      ),
                ),
              ],
            ),
        data: (events) {
          if (events.isEmpty) {
            return ListView(
              children: [
                const SizedBox(height: 80),
                EmptyView(
                  icon: Icons.event_busy_outlined,
                  title: 'event.no_events'.tr(),
                  message: 'event.checkin_no_events_desc'.tr(),
                ),
              ],
            );
          }
          return ListView.separated(
            padding: const EdgeInsets.all(16),
            itemCount: events.length,
            separatorBuilder: (_, __) => const SizedBox(height: 10),
            itemBuilder: (_, i) => _EventTile(event: events[i]),
          );
        },
      ),
    );
  }
}

class _EventTile extends StatelessWidget {
  const _EventTile({required this.event});

  final EventSummary event;

  @override
  Widget build(BuildContext context) {
    final date =
        event.startTime != null
            ? DateFormat('dd/MM/yyyy • HH:mm').format(event.startTime!)
            : null;

    return Material(
      color: AppColors.surface,
      borderRadius: BorderRadius.circular(12),
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        // Pass the title via `extra` so the scanner shows it without an extra
        // fetch; the eventId in the path is the source of truth for validation.
        onTap:
            () => context.push(
              RouteNames.adminCheckInScanner(event.id),
              extra: event.title,
            ),
        child: Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: AppColors.divider),
          ),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: AppColors.primaryLighter,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Icon(
                  Icons.qr_code_scanner,
                  color: AppColors.primary,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      event.title,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        fontWeight: FontWeight.w600,
                        fontSize: 14.5,
                      ),
                    ),
                    if (date != null) ...[
                      const SizedBox(height: 4),
                      Row(
                        children: [
                          const Icon(
                            Icons.schedule,
                            size: 13,
                            color: AppColors.textSecondary,
                          ),
                          const SizedBox(width: 4),
                          Text(
                            date,
                            style: const TextStyle(
                              color: AppColors.textSecondary,
                              fontSize: 12,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ],
                ),
              ),
              const Icon(Icons.chevron_right, color: AppColors.textSecondary),
            ],
          ),
        ),
      ),
    );
  }
}
