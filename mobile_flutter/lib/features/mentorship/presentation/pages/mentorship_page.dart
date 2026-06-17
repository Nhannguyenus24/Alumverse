import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/errors/api_exception.dart';
import '../../../../core/router/route_names.dart';
import '../../../../core/theme/app_colors.dart';
import '../providers/mentorship_providers.dart';
import '../widgets/mentor_card.dart';

/// Browse mentors — native take on the web `MentorshipPage`: title, stats
/// banner, search, category/topic filters, and a list of mentor cards.
class MentorshipPage extends ConsumerStatefulWidget {
  const MentorshipPage({super.key});

  @override
  ConsumerState<MentorshipPage> createState() => _MentorshipPageState();
}

class _MentorshipPageState extends ConsumerState<MentorshipPage> {
  final _searchCtl = TextEditingController();

  @override
  void dispose() {
    _searchCtl.dispose();
    super.dispose();
  }

  void _applyKeyword() {
    final q = ref.read(mentorQueryProvider);
    ref.read(mentorQueryProvider.notifier).state =
        q.copyWith(keyword: _searchCtl.text.trim());
  }

  @override
  Widget build(BuildContext context) {
    final mentorsAsync = ref.watch(mentorListProvider);
    final query = ref.watch(mentorQueryProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Cố vấn'),
        actions: [
          TextButton.icon(
            onPressed: () => context.push(RouteNames.mentorshipMyBookings),
            icon: const Icon(Icons.event_note, size: 18),
            label: const Text('Lịch hẹn'),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(mentorListProvider);
          await ref.read(mentorListProvider.future);
        },
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            Text(
              'CỐ VẤN',
              style: TextStyle(
                color: AppColors.primary,
                fontWeight: FontWeight.w800,
                fontSize: 28,
              ),
            ),
            const SizedBox(height: 8),
            const Text(
              'Tìm các anh chị Cựu sinh viên để được hỗ trợ trong học tập và công việc.',
              style: TextStyle(color: AppColors.textSecondary, height: 1.5),
            ),
            const SizedBox(height: 12),
            const _BecomeMentorBanner(),
            const SizedBox(height: 16),
            const _StatsBanner(),
            const SizedBox(height: 20),
            TextField(
              controller: _searchCtl,
              textInputAction: TextInputAction.search,
              onSubmitted: (_) => _applyKeyword(),
              decoration: InputDecoration(
                hintText: 'Tìm theo tên, chức danh, công ty...',
                prefixIcon: const Icon(Icons.search),
                suffixIcon: IconButton(
                  icon: const Icon(Icons.arrow_forward),
                  onPressed: _applyKeyword,
                ),
              ),
            ),
            const SizedBox(height: 12),
            const _FilterBar(),
            const SizedBox(height: 16),
            mentorsAsync.when(
              loading: () => const Padding(
                padding: EdgeInsets.all(40),
                child: Center(child: CircularProgressIndicator()),
              ),
              error: (e, _) => _ErrorBox(
                error: e,
                onRetry: () => ref.invalidate(mentorListProvider),
              ),
              data: (mentors) {
                if (mentors.isEmpty) {
                  return Padding(
                    padding: const EdgeInsets.all(32),
                    child: Center(
                      child: Text(
                        query.keyword.isNotEmpty
                            ? 'Không tìm thấy cố vấn khớp "${query.keyword}".'
                            : 'Chưa có cố vấn nào trong hệ thống.',
                        textAlign: TextAlign.center,
                        style: const TextStyle(color: AppColors.textSecondary),
                      ),
                    ),
                  );
                }
                return Column(
                  children: mentors
                      .map((m) => Padding(
                            padding: const EdgeInsets.only(bottom: 12),
                            child: MentorCard(
                              mentor: m,
                              onViewProfile: () => context.push(
                                  '${RouteNames.mentorship}/mentors/${m.memberId}'),
                              onBook: () => context.push(
                                  '${RouteNames.mentorship}/mentors/${m.memberId}/book'),
                            ),
                          ))
                      .toList(),
                );
              },
            ),
          ],
        ),
      ),
    );
  }
}

/// CTA to become a mentor, or a status line if the user already registered.
class _BecomeMentorBanner extends ConsumerWidget {
  const _BecomeMentorBanner();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(myMentorProfileProvider);
    return async.when(
      loading: () => const SizedBox.shrink(),
      error: (_, __) => _cta(context),
      data: (profile) {
        if (profile == null) return _cta(context);

        final st = (profile.status ?? '').toUpperCase();
        // Approved mentor — show quick-action buttons.
        if (st == 'APPROVED') {
          return Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: () => context.push(RouteNames.mentorAvailability),
                  icon: const Icon(Icons.calendar_month, size: 16),
                  label: const Text('Lịch rảnh'),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: ElevatedButton.icon(
                  onPressed: () => context.push(RouteNames.mentorDashboard),
                  icon: const Icon(Icons.dashboard, size: 16),
                  label: const Text('Duyệt yêu cầu'),
                ),
              ),
            ],
          );
        }

        // Other statuses (PENDING, REJECTED, DRAFT) — show status chip.
        final (label, color) = switch (st) {
          'PENDING' => ('Hồ sơ cố vấn đang chờ duyệt', AppColors.warning),
          'REJECTED' => ('Hồ sơ cố vấn bị từ chối — bấm để đăng ký lại', AppColors.error),
          'DRAFT' => ('Hồ sơ cố vấn (nháp)', AppColors.textSecondary),
          _ => ('Bạn đã đăng ký làm cố vấn', AppColors.info),
        };
        return GestureDetector(
          onTap: st == 'REJECTED' ? () => context.push(RouteNames.mentorshipSignup) : null,
          child: Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Row(
              children: [
                Icon(Icons.verified_user_outlined, color: color, size: 20),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(label,
                      style: TextStyle(
                          color: color, fontWeight: FontWeight.w600)),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _cta(BuildContext context) {
    return SizedBox(
      width: double.infinity,
      child: OutlinedButton.icon(
        onPressed: () => context.push(RouteNames.mentorshipSignup),
        icon: const Icon(Icons.school_outlined),
        label: const Text('Trở thành cố vấn'),
        style: OutlinedButton.styleFrom(
          padding: const EdgeInsets.symmetric(vertical: 12),
        ),
      ),
    );
  }
}

class _StatsBanner extends StatelessWidget {
  const _StatsBanner();

  @override
  Widget build(BuildContext context) {
    const stats = [
      ('500+', 'cố vấn'),
      ('2,000+', 'buổi họp'),
      ('100%', 'alumni xác nhận'),
    ];
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 20, horizontal: 16),
      decoration: BoxDecoration(
        color: AppColors.primary,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: stats
            .map((s) => Column(
                  children: [
                    Text(s.$1,
                        style: const TextStyle(
                            color: Colors.white,
                            fontSize: 22,
                            fontWeight: FontWeight.bold)),
                    Text(s.$2,
                        style: const TextStyle(
                            color: Colors.white70, fontSize: 12)),
                  ],
                ))
            .toList(),
      ),
    );
  }
}

/// Category + topic dropdown filters, backed by the live expertise endpoints.
class _FilterBar extends ConsumerWidget {
  const _FilterBar();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final categories = ref.watch(expertiseCategoriesProvider).valueOrNull ?? [];
    final topics = ref.watch(expertiseTopicsProvider).valueOrNull ?? [];
    final query = ref.watch(mentorQueryProvider);
    final notifier = ref.read(mentorQueryProvider.notifier);

    return Row(
      children: [
        Expanded(
          child: _Dropdown(
            hint: 'Lĩnh vực',
            value: query.category,
            options: categories,
            onChanged: (v) => notifier.state = v == null
                ? query.copyWith(clearCategory: true)
                : query.copyWith(category: v),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: _Dropdown(
            hint: 'Chủ đề',
            value: query.expertise,
            options: topics,
            onChanged: (v) => notifier.state = v == null
                ? query.copyWith(clearExpertise: true)
                : query.copyWith(expertise: v),
          ),
        ),
      ],
    );
  }
}

class _Dropdown extends StatelessWidget {
  const _Dropdown({
    required this.hint,
    required this.value,
    required this.options,
    required this.onChanged,
  });

  final String hint;
  final String? value;
  final List<String> options;
  final ValueChanged<String?> onChanged;

  @override
  Widget build(BuildContext context) {
    return DropdownButtonFormField<String>(
      value: value,
      isExpanded: true,
      decoration: InputDecoration(
        labelText: hint,
        contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      ),
      items: [
        const DropdownMenuItem(value: null, child: Text('Tất cả')),
        ...options.map((o) => DropdownMenuItem(value: o, child: Text(o, overflow: TextOverflow.ellipsis))),
      ],
      onChanged: onChanged,
    );
  }
}

class _ErrorBox extends StatelessWidget {
  const _ErrorBox({required this.onRetry, this.error});
  final VoidCallback onRetry;
  final Object? error;

  @override
  Widget build(BuildContext context) {
    final message = _messageFrom(error);
    return Padding(
      padding: const EdgeInsets.all(32),
      child: Center(
        child: Column(
          children: [
            const Icon(Icons.cloud_off_rounded,
                size: 40, color: AppColors.textSecondary),
            const SizedBox(height: 8),
            Text(
              message ?? 'Không tải được danh sách cố vấn',
              textAlign: TextAlign.center,
              style: const TextStyle(color: AppColors.textSecondary),
            ),
            TextButton(onPressed: onRetry, child: const Text('Thử lại')),
          ],
        ),
      ),
    );
  }

  /// Surface the backend message (e.g. "Vui lòng xác thực email...") instead of
  /// a generic error. The error interceptor wraps it as [ApiException].
  String? _messageFrom(Object? e) {
    if (e is DioException) {
      final inner = e.error;
      if (inner is ApiException) return inner.message;
    }
    if (e is ApiException) return e.message;
    return null;
  }
}
