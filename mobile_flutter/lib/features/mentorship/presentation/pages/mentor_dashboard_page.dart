import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/router/route_names.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../shared/widgets/app_toast.dart';
import '../../data/models/mentorship_session.dart';
import '../../data/repositories/mentorship_repository.dart';
import '../providers/mentorship_providers.dart';
import '../widgets/feedback_card.dart';

/// Mentor-side dashboard: stats, pending requests to accept/reject, upcoming
/// confirmed sessions. Mirrors `MentorshipDashboardPage.jsx`.
class MentorDashboardPage extends ConsumerStatefulWidget {
  const MentorDashboardPage({super.key});

  @override
  ConsumerState<MentorDashboardPage> createState() =>
      _MentorDashboardPageState();
}

class _MentorDashboardPageState extends ConsumerState<MentorDashboardPage>
    with SingleTickerProviderStateMixin {
  late final TabController _tabCtrl = TabController(length: 3, vsync: this);

  @override
  void dispose() {
    _tabCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final approvedAsync = ref.watch(isApprovedMentorProvider);

    return approvedAsync.when(
      loading:
          () => Scaffold(
            appBar: AppBar(title: Text('mentorship.manage_mentor'.tr())),
            body: const Center(child: CircularProgressIndicator()),
          ),
      error:
          (_, __) => _MentorOnlyScaffold(
            title: 'mentorship.manage_mentor'.tr(),
            actionLabel: 'mentorship.become_mentor'.tr(),
          ),
      data: (approved) {
        if (!approved) {
          return _MentorOnlyScaffold(
            title: 'mentorship.manage_mentor'.tr(),
            actionLabel: 'mentorship.become_mentor'.tr(),
          );
        }
        return _DashboardContent(tabCtrl: _tabCtrl);
      },
    );
  }
}

class _DashboardContent extends ConsumerWidget {
  const _DashboardContent({required this.tabCtrl});

  final TabController tabCtrl;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final sessionsAsync = ref.watch(mentorSessionsProvider);
    final profileAsync = ref.watch(myMentorProfileProvider);

    final ratingLabel =
        profileAsync.valueOrNull?.ratingAvg != null
            ? profileAsync.valueOrNull!.ratingAvg!.toStringAsFixed(1)
            : '-';

    return Scaffold(
      appBar: AppBar(
        title: Text('mentorship.manage_mentor'.tr()),
        actions: [
          IconButton(
            tooltip: 'mentorship.my_availability'.tr(),
            icon: const Icon(Icons.calendar_month),
            onPressed: () => context.push(RouteNames.mentorAvailability),
          ),
        ],
        bottom: TabBar(
          controller: tabCtrl,
          isScrollable: true,
          tabAlignment: TabAlignment.start,
          tabs: [
            Tab(text: 'mentorship.tab_pending'.tr()),
            Tab(text: 'mentorship.tab_upcoming'.tr()),
            Tab(text: 'mentorship.tab_feedbacks_received'.tr()),
          ],
        ),
      ),
      body: Column(
        children: [
          // ── Stats banner ─────────────────────────────────────────
          sessionsAsync.when(
            loading: () => const SizedBox.shrink(),
            error: (_, __) => const SizedBox.shrink(),
            data: (sessions) {
              final pending =
                  sessions
                      .where((s) => (s.status ?? '').toUpperCase() == 'PENDING')
                      .length;
              final completed =
                  sessions
                      .where(
                        (s) => (s.status ?? '').toUpperCase() == 'COMPLETED',
                      )
                      .length;
              return Container(
                padding: const EdgeInsets.symmetric(
                  vertical: 14,
                  horizontal: 16,
                ),
                color: AppColors.primary,
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceAround,
                  children: [
                    _Stat(
                      value: '${sessions.length}',
                      label: 'mentorship.stat_bookings'.tr(),
                    ),
                    _Stat(
                      value: '$pending',
                      label: 'mentorship.tab_pending'.tr(),
                    ),
                    _Stat(
                      value: '$completed',
                      label: 'mentorship.stat_completed'.tr(),
                    ),
                    _Stat(
                      value: ratingLabel,
                      label: 'mentorship.feedback'.tr(),
                    ),
                  ],
                ),
              );
            },
          ),
          // ── Tab content ──────────────────────────────────────────
          Expanded(
            child: sessionsAsync.when(
              loading: () => const Center(child: CircularProgressIndicator()),
              error:
                  (e, _) => Center(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text('mentorship.sessions_load_failed'.tr()),
                        TextButton(
                          onPressed:
                              () => ref.invalidate(mentorSessionsProvider),
                          child: Text('common.retry'.tr()),
                        ),
                      ],
                    ),
                  ),
              data: (sessions) {
                final pending =
                    sessions
                        .where(
                          (s) => (s.status ?? '').toUpperCase() == 'PENDING',
                        )
                        .toList();
                final upcoming =
                    sessions
                        .where(
                          (s) => (s.status ?? '').toUpperCase() == 'CONFIRMED',
                        )
                        .toList();
                return TabBarView(
                  controller: tabCtrl,
                  children: [
                    _PendingList(sessions: pending),
                    _UpcomingList(sessions: upcoming),
                    const _FeedbackList(),
                  ],
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}

class _MentorOnlyScaffold extends StatelessWidget {
  const _MentorOnlyScaffold({required this.title, required this.actionLabel});

  final String title;
  final String actionLabel;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(title)),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 72,
                height: 72,
                decoration: BoxDecoration(
                  color: AppColors.primary.withValues(alpha: 0.08),
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.school_outlined,
                  color: AppColors.primary,
                  size: 34,
                ),
              ),
              const SizedBox(height: 16),
              Text(
                'mentorship.mentor_only_title'.tr(),
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.w800,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                'mentorship.mentor_only_desc'.tr(),
                textAlign: TextAlign.center,
                style: const TextStyle(color: AppColors.textSecondary),
              ),
              const SizedBox(height: 20),
              FilledButton(
                onPressed: () => context.go(RouteNames.mentorship),
                child: Text(actionLabel),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ── Pending requests ───────────────────────────────────────────────────────

class _PendingList extends ConsumerWidget {
  const _PendingList({required this.sessions});
  final List<MentorshipSession> sessions;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    if (sessions.isEmpty) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(
              Icons.inbox_outlined,
              size: 48,
              color: AppColors.textSecondary,
            ),
            const SizedBox(height: 12),
            Text(
              'mentorship.no_pending_requests'.tr(),
              style: const TextStyle(color: AppColors.textSecondary),
            ),
          ],
        ),
      );
    }
    return RefreshIndicator(
      onRefresh: () async {
        ref.invalidate(mentorSessionsProvider);
        await ref.read(mentorSessionsProvider.future);
      },
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: sessions.length,
        itemBuilder: (_, i) => _PendingCard(session: sessions[i]),
      ),
    );
  }
}

class _PendingCard extends ConsumerWidget {
  const _PendingCard({required this.session});
  final MentorshipSession session;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final when =
        session.startTime != null
            ? DateFormat('dd/MM/yyyy • HH:mm').format(session.startTime!)
            : 'mentorship.pending_time'.tr();

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              session.menteeName ?? 'Mentee #${session.menteeMemberId}',
              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
            ),
            const SizedBox(height: 6),
            _InfoLine(icon: Icons.schedule, text: when),
            if (session.sessionType != null)
              _InfoLine(
                icon: Icons.category_outlined,
                text: _typeLabel(session.sessionType!),
              ),
            if (session.introduction != null &&
                session.introduction!.isNotEmpty) ...[
              const SizedBox(height: 6),
              Text(
                session.introduction!,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                  color: AppColors.textSecondary,
                  fontSize: 13,
                ),
              ),
            ],
            const SizedBox(height: 12),
            _AcceptRejectButtons(session: session),
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
}

class _AcceptRejectButtons extends ConsumerStatefulWidget {
  const _AcceptRejectButtons({required this.session});
  final MentorshipSession session;

  @override
  ConsumerState<_AcceptRejectButtons> createState() =>
      _AcceptRejectButtonsState();
}

class _AcceptRejectButtonsState extends ConsumerState<_AcceptRejectButtons> {
  bool _loading = false;
  String? _action; // 'confirm' | 'reject'

  Future<void> _update(String status) async {
    String? meetingLink;
    if (status == 'CONFIRMED') {
      meetingLink = await _askMeetingLink();
      if (meetingLink == null) return; // cancelled
    }
    setState(() {
      _loading = true;
      _action = status == 'CONFIRMED' ? 'confirm' : 'reject';
    });
    try {
      await ref
          .read(mentorshipRepositoryProvider)
          .updateSessionStatus(
            widget.session.id,
            status: status,
            meetingLink: meetingLink,
          );
      ref.invalidate(mentorSessionsProvider);
      if (mounted) {
        AppToast.success(
          context,
          status == 'CONFIRMED'
              ? 'mentorship.session_confirmed'.tr()
              : 'mentorship.session_rejected'.tr(),
        );
      }
    } catch (e) {
      if (mounted) {
        AppToast.fromError(context, e);
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<String?> _askMeetingLink() async {
    final ctl = TextEditingController();
    return showDialog<String>(
      context: context,
      builder:
          (_) => AlertDialog(
            title: Text('mentorship.meeting_link_title'.tr()),
            content: TextField(
              controller: ctl,
              keyboardType: TextInputType.url,
              decoration: InputDecoration(
                hintText: 'https://meet.google.com/...',
                labelText: 'mentorship.meeting_link_label'.tr(),
              ),
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(context),
                child: Text('common.cancel'.tr()),
              ),
              ElevatedButton(
                onPressed: () => Navigator.pop(context, ctl.text.trim()),
                child: Text('common.confirm'.tr()),
              ),
            ],
          ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: OutlinedButton(
            onPressed:
                (_loading && _action == 'reject')
                    ? null
                    : () => _update('REJECTED'),
            style: OutlinedButton.styleFrom(
              foregroundColor: AppColors.error,
              side: const BorderSide(color: AppColors.error),
            ),
            child:
                (_loading && _action == 'reject')
                    ? const SizedBox(
                      height: 16,
                      width: 16,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: AppColors.error,
                      ),
                    )
                    : Text('common.reject'.tr()),
          ),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: ElevatedButton(
            onPressed:
                (_loading && _action == 'confirm')
                    ? null
                    : () => _update('CONFIRMED'),
            child:
                (_loading && _action == 'confirm')
                    ? const SizedBox(
                      height: 16,
                      width: 16,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: Colors.white,
                      ),
                    )
                    : Text('common.confirm'.tr()),
          ),
        ),
      ],
    );
  }
}

// ── Upcoming confirmed sessions ────────────────────────────────────────────

class _UpcomingList extends ConsumerWidget {
  const _UpcomingList({required this.sessions});
  final List<MentorshipSession> sessions;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    if (sessions.isEmpty) {
      return Center(
        child: Text(
          'mentorship.no_upcoming_sessions'.tr(),
          style: const TextStyle(color: AppColors.textSecondary),
        ),
      );
    }
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: sessions.length,
      itemBuilder: (_, i) => _UpcomingCard(session: sessions[i]),
    );
  }
}

class _UpcomingCard extends StatelessWidget {
  const _UpcomingCard({required this.session});
  final MentorshipSession session;

  @override
  Widget build(BuildContext context) {
    final when =
        session.startTime != null
            ? DateFormat('dd/MM/yyyy • HH:mm').format(session.startTime!)
            : '-';
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: ListTile(
        leading: const CircleAvatar(
          backgroundColor: AppColors.info,
          child: Icon(Icons.event, color: Colors.white, size: 20),
        ),
        title: Text(
          session.menteeName ?? 'Mentee #${session.menteeMemberId}',
          style: const TextStyle(fontWeight: FontWeight.w600),
        ),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              when,
              style: const TextStyle(
                color: AppColors.textSecondary,
                fontSize: 12,
              ),
            ),
            if (session.meetingLink != null && session.meetingLink!.isNotEmpty)
              Text(
                session.meetingLink!,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(color: AppColors.primary, fontSize: 12),
              ),
          ],
        ),
      ),
    );
  }
}

// ── Feedbacks received ─────────────────────────────────────────────────────

class _FeedbackList extends ConsumerWidget {
  const _FeedbackList();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(myMentorFeedbacksProvider);
    return async.when(
      loading: () => const Center(child: CircularProgressIndicator()),
      error:
          (_, __) => Center(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text('mentorship.feedbacks_load_failed'.tr()),
                TextButton(
                  onPressed: () => ref.invalidate(myMentorFeedbacksProvider),
                  child: Text('common.retry'.tr()),
                ),
              ],
            ),
          ),
      data: (feedbacks) {
        if (feedbacks.isEmpty) {
          return Center(
            child: Text(
              'mentorship.no_feedbacks'.tr(),
              style: const TextStyle(color: AppColors.textSecondary),
            ),
          );
        }
        return ListView.builder(
          padding: const EdgeInsets.all(16),
          itemCount: feedbacks.length,
          itemBuilder: (_, i) => FeedbackCard(feedback: feedbacks[i]),
        );
      },
    );
  }
}

// ── Shared helpers ─────────────────────────────────────────────────────────

class _Stat extends StatelessWidget {
  const _Stat({required this.value, required this.label});
  final String value;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Text(
          value,
          style: const TextStyle(
            color: Colors.white,
            fontSize: 20,
            fontWeight: FontWeight.bold,
          ),
        ),
        Text(
          label,
          style: const TextStyle(color: Colors.white70, fontSize: 11),
        ),
      ],
    );
  }
}

class _InfoLine extends StatelessWidget {
  const _InfoLine({required this.icon, required this.text});
  final IconData icon;
  final String text;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(top: 4),
      child: Row(
        children: [
          Icon(icon, size: 14, color: AppColors.textSecondary),
          const SizedBox(width: 6),
          Expanded(
            child: Text(
              text,
              style: const TextStyle(
                color: AppColors.textSecondary,
                fontSize: 13,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
