import 'package:dio/dio.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/errors/api_exception.dart';
import '../../../../core/router/route_names.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../shared/widgets/empty_view.dart';
import '../../../../shared/widgets/skeleton.dart';
import '../../data/models/skill.dart';
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
    ref.read(mentorQueryProvider.notifier).state = q.copyWith(
      keyword: _searchCtl.text.trim(),
    );
  }

  @override
  Widget build(BuildContext context) {
    final mentorsAsync = ref.watch(mentorListProvider);
    final query = ref.watch(mentorQueryProvider);

    return Scaffold(
      appBar: AppBar(
        title: Text('mentorship.title'.tr()),
        actions: [
          TextButton.icon(
            onPressed: () => context.push(RouteNames.mentorshipMyBookings),
            icon: const Icon(Icons.event_note, size: 18),
            label: Text('mentorship.appointments'.tr()),
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
              'mentorship.title_upper'.tr(),
              style: const TextStyle(
                color: AppColors.primary,
                fontWeight: FontWeight.w900,
                fontSize: 30,
                letterSpacing: 0.2,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'mentorship.desc'.tr(),
              style: const TextStyle(
                color: AppColors.textSecondary,
                height: 1.5,
              ),
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
                hintText: 'mentorship.search_hint'.tr(),
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
              loading:
                  () => Column(
                    children: List.generate(4, (_) => const SkeletonTile()),
                  ),
              error:
                  (e, _) => _ErrorBox(
                    error: e,
                    onRetry: () => ref.invalidate(mentorListProvider),
                  ),
              data: (mentors) {
                if (mentors.isEmpty) {
                  return EmptyView(
                    icon: Icons.person_search_outlined,
                    title:
                        query.keyword.isNotEmpty
                            ? 'mentorship.no_mentor_found'.tr()
                            : 'mentorship.no_mentor'.tr(),
                    message:
                        query.keyword.isNotEmpty
                            ? 'mentorship.no_mentor_keyword'.tr(
                              namedArgs: {'keyword': query.keyword},
                            )
                            : 'mentorship.no_mentor_desc'.tr(),
                  );
                }
                return Column(
                  children:
                      mentors
                          .map(
                            (m) => Padding(
                              padding: const EdgeInsets.only(bottom: 12),
                              child: MentorCard(
                                mentor: m,
                                onViewProfile:
                                    () => context.push(
                                      '${RouteNames.mentorship}/mentors/${m.memberId}',
                                    ),
                                onBook:
                                    () => context.push(
                                      '${RouteNames.mentorship}/mentors/${m.memberId}/book',
                                    ),
                              ),
                            ),
                          )
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
                  label: Text('mentorship.available_slots'.tr()),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: ElevatedButton.icon(
                  onPressed: () => context.push(RouteNames.mentorDashboard),
                  icon: const Icon(Icons.dashboard, size: 16),
                  label: Text('mentorship.review_requests'.tr()),
                ),
              ),
            ],
          );
        }

        // Other statuses (PENDING, REJECTED, DRAFT) — show status chip.
        final (label, color) = switch (st) {
          'PENDING' => ('mentorship.banner_pending'.tr(), AppColors.warning),
          'REJECTED' => ('mentorship.banner_rejected'.tr(), AppColors.error),
          'DRAFT' => ('mentorship.banner_draft'.tr(), AppColors.textSecondary),
          _ => ('mentorship.banner_registered'.tr(), AppColors.info),
        };
        return GestureDetector(
          onTap:
              st == 'REJECTED'
                  ? () => context.push(RouteNames.mentorshipSignup)
                  : null,
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
                  child: Text(
                    label,
                    style: TextStyle(color: color, fontWeight: FontWeight.w600),
                  ),
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
        label: Text('mentorship.become_mentor'.tr()),
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
    final stats = [
      ('500+', 'mentorship.stats_mentors'.tr()),
      ('2,000+', 'mentorship.stats_sessions'.tr()),
      ('100%', 'mentorship.stats_alumni'.tr()),
    ];
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 20, horizontal: 16),
      decoration: BoxDecoration(
        color: AppColors.primary,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children:
            stats
                .map(
                  (s) => Column(
                    children: [
                      Text(
                        s.$1,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 22,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      Text(
                        s.$2,
                        style: const TextStyle(
                          color: Colors.white70,
                          fontSize: 12,
                        ),
                      ),
                    ],
                  ),
                )
                .toList(),
      ),
    );
  }
}

/// "Filter theo kỹ năng": multi-select over the skills catalog. Replaces the
/// old separate category/topic dropdowns (free-text values). Tapping opens a
/// search dialog (%LIKE%, sorted A-Z by the backend); selected skills render
/// as removable chips.
class _FilterBar extends ConsumerWidget {
  const _FilterBar();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final query = ref.watch(mentorQueryProvider);
    final notifier = ref.read(mentorQueryProvider.notifier);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        OutlinedButton.icon(
          onPressed: () async {
            final result = await showModalBottomSheet<List<Skill>>(
              context: context,
              isScrollControlled: true,
              builder: (_) => _SkillFilterSheet(initialSelected: query.skills),
            );
            if (result != null) {
              notifier.state = query.copyWith(skills: result);
            }
          },
          icon: const Icon(Icons.tune, size: 18),
          label: Text(
            query.skills.isEmpty
                ? 'mentorship.filter_skill'.tr()
                : 'mentorship.filter_skill_count'.tr(
                  namedArgs: {'count': query.skills.length.toString()},
                ),
          ),
        ),
        if (query.skills.isNotEmpty) ...[
          const SizedBox(height: 8),
          Wrap(
            spacing: 6,
            runSpacing: 6,
            children:
                query.skills
                    .map(
                      (s) => Chip(
                        label: Text(s.name),
                        onDeleted:
                            () =>
                                notifier.state = query.copyWith(
                                  skills:
                                      query.skills
                                          .where((sk) => sk.id != s.id)
                                          .toList(),
                                ),
                      ),
                    )
                    .toList(),
          ),
        ],
      ],
    );
  }
}

/// Bottom sheet: search box (%LIKE%, debounced via provider family) + a
/// checkable list of matching skills from the catalog.
class _SkillFilterSheet extends ConsumerStatefulWidget {
  const _SkillFilterSheet({required this.initialSelected});

  final List<Skill> initialSelected;

  @override
  ConsumerState<_SkillFilterSheet> createState() => _SkillFilterSheetState();
}

class _SkillFilterSheetState extends ConsumerState<_SkillFilterSheet> {
  final _searchCtl = TextEditingController();
  String _search = '';
  final List<Skill> _selected = [];

  @override
  void initState() {
    super.initState();
    _selected.addAll(widget.initialSelected);
  }

  @override
  void dispose() {
    _searchCtl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final resultsAsync = ref.watch(skillSearchProvider(_search));

    return DraggableScrollableSheet(
      initialChildSize: 0.7,
      minChildSize: 0.4,
      maxChildSize: 0.9,
      expand: false,
      builder: (context, scrollController) {
        return Padding(
          padding: EdgeInsets.only(
            left: 16,
            right: 16,
            top: 16,
            bottom: MediaQuery.of(context).viewInsets.bottom + 16,
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'mentorship.filter_skill'.tr(),
                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _searchCtl,
                onChanged: (v) => setState(() => _search = v),
                decoration: InputDecoration(
                  hintText: 'mentorship.filter_skill_search_hint'.tr(),
                  prefixIcon: const Icon(Icons.search),
                ),
              ),
              const SizedBox(height: 8),
              Expanded(
                child: resultsAsync.when(
                  loading: () => const Center(child: CircularProgressIndicator()),
                  error: (_, __) => Center(child: Text('mentorship.load_failed'.tr())),
                  data: (skills) {
                    if (skills.isEmpty) {
                      return Center(child: Text('mentorship.no_skill_found'.tr()));
                    }
                    return ListView.builder(
                      controller: scrollController,
                      itemCount: skills.length,
                      itemBuilder: (_, i) {
                        final skill = skills[i];
                        final checked = _selected.any((s) => s.id == skill.id);
                        return CheckboxListTile(
                          value: checked,
                          title: Text(skill.name),
                          onChanged: (v) {
                            setState(() {
                              if (v == true) {
                                _selected.add(skill);
                              } else {
                                _selected.removeWhere((s) => s.id == skill.id);
                              }
                            });
                          },
                        );
                      },
                    );
                  },
                ),
              ),
              const SizedBox(height: 8),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () => Navigator.of(context).pop(_selected),
                  child: Text('common.apply'.tr()),
                ),
              ),
            ],
          ),
        );
      },
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
    final needsVerification =
        _statusFrom(error) == 401 || _statusFrom(error) == 403;
    return Padding(
      padding: const EdgeInsets.all(32),
      child: Center(
        child: Column(
          children: [
            Icon(
              needsVerification
                  ? Icons.verified_user_outlined
                  : Icons.cloud_off_rounded,
              size: 40,
              color: AppColors.textSecondary,
            ),
            const SizedBox(height: 8),
            Text(
              message ?? 'mentorship.load_failed'.tr(),
              textAlign: TextAlign.center,
              style: const TextStyle(color: AppColors.textSecondary),
            ),
            const SizedBox(height: 8),
            if (needsVerification)
              ElevatedButton.icon(
                onPressed:
                    () => context.push(RouteNames.organizationRegistration),
                icon: const Icon(Icons.verified_user_outlined, size: 18),
                label: Text('mentorship.verify_account'.tr()),
              )
            else
              TextButton(onPressed: onRetry, child: Text('common.retry'.tr())),
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

  int? _statusFrom(Object? e) {
    if (e is DioException && e.error is ApiException) {
      return (e.error as ApiException).statusCode;
    }
    if (e is ApiException) return e.statusCode;
    return null;
  }
}
