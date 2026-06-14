import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../../../../core/router/route_names.dart';
import '../../../../core/theme/app_colors.dart';
import '../../data/models/mentorship_session.dart';
import '../../data/repositories/mentorship_repository.dart';
import '../providers/mentorship_providers.dart';
import '../widgets/feedback_dialog.dart';

const _tabDefs = [
  (key: 'all', label: 'Tất cả'),
  (key: 'upcoming', label: 'Sắp tới'),
  (key: 'completed', label: 'Đã hoàn thành'),
  (key: 'cancelled', label: 'Đã hủy / Từ chối'),
];

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
  late final TabController _tabCtrl =
      TabController(length: _tabDefs.length, vsync: this);

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
        title: const Text('Lịch hẹn của tôi'),
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
              const Text('Không tải được lịch hẹn'),
              TextButton(
                onPressed: () => ref.invalidate(mySessionsProvider),
                child: const Text('Thử lại'),
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
                  ? 'Bạn chưa có lịch hẹn nào'
                  : 'Không có lịch hẹn trong mục này',
              style: const TextStyle(color: AppColors.textSecondary),
            ),
            if (tabKey == 'all') ...[
              const SizedBox(height: 12),
              ElevatedButton(
                onPressed: () => context.go(RouteNames.mentorship),
                child: const Text('Tìm mentor'),
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
        : 'Chưa xác định';

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
                        'Cố vấn #${session.mentorMemberId ?? '-'}',
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
            const SizedBox(height: 10),
            Row(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                if (isCompleted)
                  TextButton.icon(
                    onPressed: () => _openFeedback(context),
                    icon: const Icon(Icons.star_outline,
                        size: 16, color: AppColors.secondary),
                    label: const Text('Đánh giá',
                        style: TextStyle(color: AppColors.secondary)),
                  ),
                if (canCancel)
                  TextButton.icon(
                    onPressed: () => _confirmCancel(context, ref),
                    icon: const Icon(Icons.close,
                        size: 16, color: AppColors.error),
                    label: const Text('Hủy',
                        style: TextStyle(color: AppColors.error)),
                  ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  String _typeLabel(String t) => switch (t.toUpperCase()) {
        'CAREER' => 'Nghề nghiệp',
        'ACADEMIC' => 'Học thuật',
        'SOFT_SKILLS' => 'Kỹ năng mềm',
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
        title: const Text('Hủy lịch hẹn?'),
        content: const Text('Bạn chắc chắn muốn hủy buổi hẹn này?'),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(context, false),
              child: const Text('Không')),
          TextButton(
              onPressed: () => Navigator.pop(context, true),
              child: const Text('Hủy lịch',
                  style: TextStyle(color: AppColors.error))),
        ],
      ),
    );
    if (ok != true) return;
    try {
      await ref.read(mentorshipRepositoryProvider).cancelSession(session.id);
      ref.invalidate(mySessionsProvider);
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Đã hủy lịch hẹn')));
      }
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
            content:
                Text(e.toString().replaceFirst('Exception: ', ''))));
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
      'PENDING' => ('Chờ duyệt', AppColors.warning),
      'CONFIRMED' => ('Đã xác nhận', AppColors.info),
      'COMPLETED' => ('Hoàn thành', AppColors.success),
      'CANCELLED' => ('Đã hủy', AppColors.error),
      'REJECTED' => ('Bị từ chối', AppColors.error),
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
