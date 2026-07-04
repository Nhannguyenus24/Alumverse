import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../../core/router/route_names.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../shared/widgets/app_toast.dart';
import '../../data/models/mentorship_session.dart';
import '../../data/repositories/mentorship_repository.dart';
import '../providers/mentorship_providers.dart';
import '../widgets/feedback_dialog.dart';

bool _matchTab(String key, MentorshipSession s) {
  final st = (s.status ?? '').toUpperCase();
  return switch (key) {
    'upcoming' => st == 'PENDING' || st == 'CONFIRMED',
    'completed' => st == 'COMPLETED',
    'cancelled' => st == 'CANCELLED' || st == 'REJECTED',
    _ => true,
  };
}

class MyBookingsPage extends ConsumerStatefulWidget {
  const MyBookingsPage({super.key});

  @override
  ConsumerState<MyBookingsPage> createState() => _MyBookingsPageState();
}

class _MyBookingsPageState extends ConsumerState<MyBookingsPage>
    with SingleTickerProviderStateMixin {
  // Tab definitions are built in build() so they can access context for .tr()
  late TabController _tabCtrl;
  late List<({String key, String label})> _tabDefs;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _tabDefs = [
      (key: 'all', label: 'common.all'.tr()),
      (key: 'upcoming', label: 'mentorship.tab_upcoming'.tr()),
      (key: 'completed', label: 'mentorship.status_completed'.tr()),
      (key: 'cancelled', label: 'mentorship.tab_cancelled'.tr()),
    ];
    if (!_tabCtrlInitialised) {
      _tabCtrl = TabController(length: _tabDefs.length, vsync: this);
      _tabCtrlInitialised = true;
    }
  }

  bool _tabCtrlInitialised = false;

  @override
  void dispose() {
    _tabCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final async = ref.watch(mySessionsProvider);

    return Scaffold(
      appBar: AppBar(
        title: Text('mentorship.my_bookings'.tr()),
        bottom: TabBar(
          controller: _tabCtrl,
          isScrollable: true,
          tabAlignment: TabAlignment.start,
          tabs: _tabDefs.map((t) => Tab(text: t.label)).toList(),
        ),
      ),
      body: async.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text('mentorship.bookings_load_failed'.tr()),
              TextButton(
                onPressed: () => ref.invalidate(mySessionsProvider),
                child: Text('common.retry'.tr()),
              ),
            ],
          ),
        ),
        data: (sessions) => TabBarView(
          controller: _tabCtrl,
          children: _tabDefs
              .map((t) => _SessionList(
                    sessions:
                        sessions.where((s) => _matchTab(t.key, s)).toList(),
                    tabKey: t.key,
                  ))
              .toList(),
        ),
      ),
    );
  }
}

class _SessionList extends ConsumerWidget {
  const _SessionList({required this.sessions, required this.tabKey});

  final List<MentorshipSession> sessions;
  final String tabKey;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    if (sessions.isEmpty) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.event_busy,
                size: 48, color: AppColors.textSecondary),
            const SizedBox(height: 12),
            Text(
              tabKey == 'all'
                  ? 'mentorship.no_bookings_yet'.tr()
                  : 'mentorship.no_bookings_in_tab'.tr(),
              style: const TextStyle(color: AppColors.textSecondary),
            ),
            if (tabKey == 'all') ...[
              const SizedBox(height: 12),
              ElevatedButton(
                onPressed: () => context.go(RouteNames.mentorship),
                child: Text('mentorship.find_mentor'.tr()),
              ),
            ],
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: () async {
        ref.invalidate(mySessionsProvider);
        await ref.read(mySessionsProvider.future);
      },
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: sessions.length,
        itemBuilder: (_, i) => _SessionCard(session: sessions[i]),
      ),
    );
  }
}

class _SessionCard extends ConsumerWidget {
  const _SessionCard({required this.session});

  final MentorshipSession session;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final st = (session.status ?? '').toUpperCase();
    final isCompleted = st == 'COMPLETED';
    final canCancel = st == 'PENDING' || st == 'CONFIRMED';
    final when = session.startTime != null
        ? DateFormat('dd/MM/yyyy • HH:mm').format(session.startTime!)
        : 'mentorship.time_unconfirmed'.tr();

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(
                    session.mentorName ??
                        'mentorship.mentor_fallback'.tr(namedArgs: {
                          'id': session.mentorMemberId?.toString() ?? '-'
                        }),
                    style: const TextStyle(
                        fontWeight: FontWeight.bold, fontSize: 16),
                  ),
                ),
                _StatusChip(status: session.status),
              ],
            ),
            const SizedBox(height: 8),
            _InfoRow(icon: Icons.schedule, text: when),
            if (session.sessionType != null)
              _InfoRow(
                  icon: Icons.category_outlined,
                  text: _typeLabel(session.sessionType!)),
            if (session.introduction != null &&
                session.introduction!.isNotEmpty) ...[
              const SizedBox(height: 6),
              Text(
                session.introduction!,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                    color: AppColors.textSecondary, fontSize: 13),
              ),
            ],
            if (st == 'CONFIRMED' &&
                session.meetingLink != null &&
                session.meetingLink!.isNotEmpty) ...[
              const SizedBox(height: 6),
              _MeetingLinkRow(url: session.meetingLink!),
            ],
            const SizedBox(height: 10),
            Row(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                if (isCompleted)
                  TextButton.icon(
                    onPressed: () => _openFeedback(context),
                    icon: const Icon(Icons.star_outline,
                        size: 16, color: AppColors.secondary),
                    label: Text('mentorship.feedback'.tr(),
                        style:
                            const TextStyle(color: AppColors.secondary)),
                  ),
                if (canCancel)
                  TextButton.icon(
                    onPressed: () => _confirmCancel(context, ref),
                    icon: const Icon(Icons.close,
                        size: 16, color: AppColors.error),
                    label: Text('mentorship.cancel_session'.tr(),
                        style: const TextStyle(color: AppColors.error)),
                  ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  String _typeLabel(String t) => switch (t.toUpperCase()) {
        'CAREER' => 'mentorship.type_career'.tr(),
        'ACADEMIC' => 'mentorship.type_academic'.tr(),
        'SOFT_SKILLS' => 'mentorship.type_soft_skills'.tr(),
        _ => t,
      };

  Future<void> _openFeedback(BuildContext context) async {
    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (_) => FeedbackBottomSheet(sessionId: session.id),
    );
  }

  Future<void> _confirmCancel(BuildContext context, WidgetRef ref) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: Text('mentorship.cancel_booking_title'.tr()),
        content: Text('mentorship.cancel_booking_content'.tr()),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(context, false),
              child: Text('common.no'.tr())),
          TextButton(
              onPressed: () => Navigator.pop(context, true),
              child: Text('mentorship.cancel_session'.tr(),
                  style: const TextStyle(color: AppColors.error))),
        ],
      ),
    );
    if (ok != true) return;
    try {
      await ref.read(mentorshipRepositoryProvider).cancelSession(session.id);
      ref.invalidate(mySessionsProvider);
      if (context.mounted) {
        AppToast.success(context, 'mentorship.booking_cancelled'.tr());
      }
    } catch (e) {
      if (context.mounted) {
        AppToast.fromError(context, e);
      }
    }
  }
}

class _StatusChip extends StatelessWidget {
  const _StatusChip({this.status});
  final String? status;

  @override
  Widget build(BuildContext context) {
    final s = (status ?? '').toUpperCase();
    final (label, color) = switch (s) {
      'PENDING' => ('mentorship.status_pending'.tr(), AppColors.warning),
      'CONFIRMED' => ('mentorship.status_confirmed'.tr(), AppColors.info),
      'COMPLETED' => ('mentorship.status_completed'.tr(), AppColors.success),
      'CANCELLED' => ('mentorship.status_cancelled'.tr(), AppColors.error),
      'REJECTED' => ('mentorship.status_rejected'.tr(), AppColors.error),
      _ => (status ?? '—', AppColors.textSecondary),
    };
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(label,
          style: TextStyle(
              color: color, fontSize: 12, fontWeight: FontWeight.w600)),
    );
  }
}

class _InfoRow extends StatelessWidget {
  const _InfoRow({required this.icon, required this.text});
  final IconData icon;
  final String text;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(top: 4),
      child: Row(
        children: [
          Icon(icon, size: 15, color: AppColors.textSecondary),
          const SizedBox(width: 6),
          Expanded(
              child: Text(text,
                  style: const TextStyle(
                      color: AppColors.textSecondary, fontSize: 13))),
        ],
      ),
    );
  }
}

class _MeetingLinkRow extends StatelessWidget {
  const _MeetingLinkRow({required this.url});

  final String url;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: () async {
        final uri = Uri.tryParse(url);
        if (uri != null && await canLaunchUrl(uri)) {
          await launchUrl(uri, mode: LaunchMode.externalApplication);
        }
      },
      borderRadius: BorderRadius.circular(8),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
        decoration: BoxDecoration(
          color: AppColors.primaryLighter,
          borderRadius: BorderRadius.circular(8),
        ),
        child: Row(
          children: [
            const Icon(Icons.videocam_outlined, size: 16, color: AppColors.primary),
            const SizedBox(width: 6),
            Expanded(
              child: Text(
                'mentorship.join_meeting'.tr(),
                style: const TextStyle(
                  color: AppColors.primary,
                  fontWeight: FontWeight.w600,
                  fontSize: 13,
                ),
              ),
            ),
            const Icon(Icons.open_in_new, size: 14, color: AppColors.primary),
          ],
        ),
      ),
    );
  }
}
