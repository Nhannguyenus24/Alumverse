import 'dart:convert';

import 'package:cached_network_image/cached_network_image.dart';
import 'package:dio/dio.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/errors/api_exception.dart';
import '../../../../core/router/route_names.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/utils/image_url.dart';
import '../providers/mentorship_providers.dart';
import '../widgets/feedback_card.dart';

/// Mentor public profile with two tabs: info and public feedback reviews.
/// Mirrors the web `MentorshipPublicProfilePage`.
class MentorProfilePage extends ConsumerStatefulWidget {
  const MentorProfilePage({super.key, required this.memberId});

  final int memberId;

  @override
  ConsumerState<MentorProfilePage> createState() => _MentorProfilePageState();
}

class _MentorProfilePageState extends ConsumerState<MentorProfilePage>
    with SingleTickerProviderStateMixin {
  late final TabController _tabCtrl = TabController(length: 2, vsync: this);

  @override
  void dispose() {
    _tabCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final profileAsync = ref.watch(mentorProfileProvider(widget.memberId));
    final accessAsync = ref.watch(mentorshipAccessProvider);
    final access = accessAsync.valueOrNull;
    final myMentorAsync = ref.watch(myMentorProfileProvider);
    final myMenteeAsync = ref.watch(myMenteeProfileProvider);
    final myMentor = myMentorAsync.valueOrNull;
    final isMentorPending = (myMentor?.status ?? '').toUpperCase() == 'PENDING';
    final isOwnMentorProfile = myMentor?.memberId == widget.memberId;
    final showBook = !(access?.isOrgManager ?? false);
    final canBook =
        (access?.canParticipateInMentorship ?? false) &&
        !isMentorPending &&
        !isOwnMentorProfile &&
        ((myMentor?.status ?? '').toUpperCase() == 'APPROVED' ||
            myMenteeAsync.valueOrNull != null);

    return Scaffold(
      appBar: AppBar(
        title: Text('mentorship.mentor_profile'.tr()),
        bottom: TabBar(
          controller: _tabCtrl,
          tabs: [
            Tab(text: 'mentorship.tab_info'.tr()),
            Tab(text: 'mentorship.feedback'.tr()),
          ],
        ),
      ),
      body: profileAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error:
            (e, _) => Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text('mentorship.profile_load_failed'.tr()),
                  TextButton(
                    onPressed:
                        () => ref.invalidate(
                          mentorProfileProvider(widget.memberId),
                        ),
                    child: Text('common.retry'.tr()),
                  ),
                ],
              ),
            ),
        data: (m) {
          final avatar = resolveImageUrl(m.avatarUrl);
          final rating =
              m.ratingAvg != null ? m.ratingAvg!.toStringAsFixed(1) : '0.0';
          final extended = _MentorExtendedProfile.fromRaw(m.extendedProfile);
          final tags =
              {
                ...m.expertiseTags,
                ...extended.expertiseTags,
                ...m.expertiseTopics,
              }.where((t) => t.trim().isNotEmpty).toList();

          return Column(
            children: [
              // ── Header (always visible above tabs) ──────────────────
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(20),
                decoration: const BoxDecoration(
                  gradient: LinearGradient(
                    colors: [AppColors.primaryDark, AppColors.primary],
                  ),
                ),
                child: Column(
                  children: [
                    CircleAvatar(
                      radius: 44,
                      backgroundColor: Colors.white,
                      backgroundImage:
                          avatar != null
                              ? CachedNetworkImageProvider(avatar)
                              : null,
                      child:
                          avatar == null
                              ? const Icon(
                                Icons.person,
                                size: 48,
                                color: AppColors.primary,
                              )
                              : null,
                    ),
                    const SizedBox(height: 10),
                    Text(
                      m.displayName,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 19,
                        fontWeight: FontWeight.bold,
                      ),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 2),
                    Text(
                      m.roleLine,
                      style: const TextStyle(
                        color: Colors.white70,
                        fontSize: 13,
                      ),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 6),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(
                          Icons.star,
                          color: AppColors.secondary,
                          size: 17,
                        ),
                        const SizedBox(width: 4),
                        Text(
                          'mentorship.rating_sessions'.tr(
                            namedArgs: {
                              'rating': rating,
                              'count': m.totalSessions.toString(),
                            },
                          ),
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 13,
                          ),
                        ),
                      ],
                    ),
                    if (showBook) ...[
                      const SizedBox(height: 12),
                      SizedBox(
                        width: double.infinity,
                        child: ElevatedButton.icon(
                          onPressed:
                              canBook
                                  ? () => context.push(
                                    '${RouteNames.mentorship}/mentors/${widget.memberId}/book',
                                  )
                                  : null,
                          icon: const Icon(Icons.calendar_month, size: 18),
                          label: Text('mentorship.book_appointment'.tr()),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.white,
                            foregroundColor: AppColors.primary,
                            padding: const EdgeInsets.symmetric(vertical: 10),
                          ),
                        ),
                      ),
                    ],
                  ],
                ),
              ),
              // ── Tab content ─────────────────────────────────────────
              Expanded(
                child: TabBarView(
                  controller: _tabCtrl,
                  children: [
                    // Tab 1: Info
                    ListView(
                      padding: const EdgeInsets.all(16),
                      children: [
                        if (extended.experienceSummary.isNotEmpty) ...[
                          _SectionLabel(
                            'mentorship.shareable_content'.tr(),
                            icon: Icons.workspace_premium_outlined,
                          ),
                          const SizedBox(height: 8),
                          Text(
                            extended.experienceSummary,
                            style: const TextStyle(
                              color: AppColors.textSecondary,
                              fontSize: 15,
                              height: 1.55,
                            ),
                          ),
                          const SizedBox(height: 22),
                        ],
                        if (tags.isNotEmpty) ...[
                          _SectionLabel(
                            'mentorship.expertise'.tr(),
                            icon: Icons.verified_outlined,
                          ),
                          const SizedBox(height: 8),
                          Wrap(
                            spacing: 8,
                            runSpacing: 8,
                            children:
                                tags
                                    .map(
                                      (t) => Chip(
                                        label: Text(t),
                                        backgroundColor: AppColors.primary
                                            .withValues(alpha: 0.08),
                                        labelStyle: const TextStyle(
                                          color: AppColors.primary,
                                          fontSize: 13,
                                          fontWeight: FontWeight.w600,
                                        ),
                                        side: BorderSide(
                                          color: AppColors.primary.withValues(
                                            alpha: 0.12,
                                          ),
                                        ),
                                      ),
                                    )
                                    .toList(),
                          ),
                          const SizedBox(height: 22),
                        ],
                        for (final section in extended.sections) ...[
                          _ProfileSection(section: section),
                          const SizedBox(height: 22),
                        ],
                      ],
                    ),

                    // Tab 2: Feedback / Reviews
                    _FeedbackTab(memberId: widget.memberId),
                  ],
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}

/// Loads and displays the mentor's public feedback list.
class _FeedbackTab extends ConsumerWidget {
  const _FeedbackTab({required this.memberId});

  final int memberId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(mentorFeedbacksProvider(memberId));

    return async.when(
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (e, __) {
        // 403 = the user isn't org-verified for mentorship yet — guide them to
        // verify instead of showing a generic load failure.
        if (_statusOf(e) == 403) {
          return Center(
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(
                    Icons.lock_outline,
                    size: 40,
                    color: AppColors.textSecondary,
                  ),
                  const SizedBox(height: 12),
                  Text(
                    'mentorship.verify_required_feedback'.tr(),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 12),
                  ElevatedButton.icon(
                    onPressed:
                        () => context.push(RouteNames.organizationRegistration),
                    icon: const Icon(Icons.verified_user_outlined, size: 18),
                    label: Text('mentorship.verify_academic'.tr()),
                  ),
                ],
              ),
            ),
          );
        }
        return Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text('mentorship.feedbacks_load_failed'.tr()),
              TextButton(
                onPressed:
                    () => ref.invalidate(mentorFeedbacksProvider(memberId)),
                child: Text('common.retry'.tr()),
              ),
            ],
          ),
        );
      },
      data: (feedbacks) {
        if (feedbacks.isEmpty) {
          return Center(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(
                  Icons.rate_review_outlined,
                  size: 48,
                  color: AppColors.textSecondary,
                ),
                const SizedBox(height: 12),
                Text(
                  'mentorship.no_feedbacks'.tr(),
                  style: const TextStyle(color: AppColors.textSecondary),
                ),
              ],
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

class _ProfileSection extends StatelessWidget {
  const _ProfileSection({required this.section});

  final _ExtendedSection section;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _SectionLabel(section.title, icon: section.icon),
        const SizedBox(height: 10),
        ...section.items.map(
          (item) => Container(
            width: double.infinity,
            margin: const EdgeInsets.only(bottom: 10),
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: AppColors.divider),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.035),
                  blurRadius: 10,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (item.title.isNotEmpty)
                  Text(
                    item.title,
                    style: const TextStyle(
                      fontWeight: FontWeight.w800,
                      fontSize: 15,
                    ),
                  ),
                if (item.subtitle.isNotEmpty) ...[
                  const SizedBox(height: 3),
                  Text(
                    item.subtitle,
                    style: const TextStyle(
                      color: AppColors.primary,
                      fontSize: 13,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ],
                if (item.period.isNotEmpty) ...[
                  const SizedBox(height: 3),
                  Text(
                    item.period,
                    style: const TextStyle(
                      color: AppColors.textSecondary,
                      fontSize: 12,
                    ),
                  ),
                ],
                if (item.description.isNotEmpty) ...[
                  const SizedBox(height: 8),
                  Text(
                    item.description,
                    style: const TextStyle(
                      color: AppColors.textSecondary,
                      fontSize: 13,
                      height: 1.45,
                    ),
                  ),
                ],
                if (item.link.isNotEmpty) ...[
                  const SizedBox(height: 8),
                  Text(
                    item.link,
                    style: const TextStyle(
                      color: AppColors.primary,
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ],
            ),
          ),
        ),
      ],
    );
  }
}

class _SectionLabel extends StatelessWidget {
  const _SectionLabel(this.text, {this.icon});
  final String text;
  final IconData? icon;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        if (icon != null) ...[
          Icon(icon, color: AppColors.primary, size: 18),
          const SizedBox(width: 6),
        ],
        Expanded(
          child: Text(
            text.toUpperCase(),
            style: const TextStyle(
              color: AppColors.primary,
              fontWeight: FontWeight.w800,
              fontSize: 12,
              letterSpacing: 0.5,
            ),
          ),
        ),
      ],
    );
  }
}

class _MentorExtendedProfile {
  const _MentorExtendedProfile({
    this.experienceSummary = '',
    this.expertiseTags = const [],
    this.sections = const [],
  });

  final String experienceSummary;
  final List<String> expertiseTags;
  final List<_ExtendedSection> sections;

  factory _MentorExtendedProfile.fromRaw(String? raw) {
    if (raw == null || raw.trim().isEmpty) {
      return const _MentorExtendedProfile();
    }
    try {
      final decoded = jsonDecode(raw);
      if (decoded is! Map<String, dynamic>) {
        return const _MentorExtendedProfile();
      }

      return _MentorExtendedProfile(
        experienceSummary: _text(decoded['experienceSummary']),
        expertiseTags: _stringList(decoded['expertiseTags']),
        sections:
            [
              _section(
                key: 'educations',
                title: 'mentorship.signup_education_title'.tr().replaceAll(
                  '*',
                  '',
                ),
                icon: Icons.school_outlined,
                rows: decoded['educations'],
                titleKeys: const ['school', 'degree', 'name', 'title'],
                subtitleKeys: const ['degree', 'school'],
                periodKeys: const ['period'],
              ),
              _section(
                key: 'experiences',
                title: 'mentorship.signup_experience_title'.tr().replaceAll(
                  '*',
                  '',
                ),
                icon: Icons.work_outline,
                rows: decoded['experiences'],
                titleKeys: const ['title', 'role', 'position'],
                subtitleKeys: const ['company', 'organization'],
                periodKeys: const ['period'],
                descriptionKeys: const ['description'],
              ),
              _section(
                key: 'projects',
                title: 'mentorship.signup_projects_title'.tr(),
                icon: Icons.folder_open_outlined,
                rows: decoded['projects'],
                titleKeys: const ['name', 'title'],
                descriptionKeys: const ['description'],
                linkKeys: const ['link', 'url'],
              ),
              _section(
                key: 'awards',
                title: 'mentorship.signup_awards_title'.tr(),
                icon: Icons.emoji_events_outlined,
                rows: decoded['awards'],
                titleKeys: const ['name', 'title'],
                periodKeys: const ['year'],
                descriptionKeys: const ['description'],
              ),
              _section(
                key: 'skills',
                title: 'mentorship.signup_skills_title'.tr(),
                icon: Icons.workspace_premium_outlined,
                rows: decoded['skills'],
                titleKeys: const ['name', 'title'],
                subtitleKeys: const ['issuer'],
              ),
            ].where((s) => s.items.isNotEmpty).toList(),
      );
    } catch (_) {
      return const _MentorExtendedProfile();
    }
  }

  static _ExtendedSection _section({
    required String key,
    required String title,
    required IconData icon,
    required dynamic rows,
    List<String> titleKeys = const [],
    List<String> subtitleKeys = const [],
    List<String> periodKeys = const [],
    List<String> descriptionKeys = const [],
    List<String> linkKeys = const [],
  }) {
    final items =
        rows is List
            ? rows
                .whereType<Map>()
                .map((row) => row.cast<String, dynamic>())
                .map(
                  (row) => _ExtendedItem(
                    title: _first(row, titleKeys),
                    subtitle: _firstDifferent(
                      row,
                      subtitleKeys,
                      _first(row, titleKeys),
                    ),
                    period: _first(row, periodKeys),
                    description: _first(row, descriptionKeys),
                    link: _first(row, linkKeys),
                  ),
                )
                .where((item) => item.hasContent)
                .toList()
            : <_ExtendedItem>[];
    return _ExtendedSection(key: key, title: title, icon: icon, items: items);
  }

  static String _first(Map<String, dynamic> row, List<String> keys) {
    for (final key in keys) {
      final value = _text(row[key]);
      if (value.isNotEmpty) return value;
    }
    return '';
  }

  static String _firstDifferent(
    Map<String, dynamic> row,
    List<String> keys,
    String existing,
  ) {
    final value = _first(row, keys);
    return value == existing ? '' : value;
  }

  static String _text(dynamic value) => value?.toString().trim() ?? '';

  static List<String> _stringList(dynamic value) =>
      value is List
          ? value
              .map((e) => e.toString().trim())
              .where((e) => e.isNotEmpty)
              .toSet()
              .toList()
          : const [];
}

class _ExtendedSection {
  const _ExtendedSection({
    required this.key,
    required this.title,
    required this.icon,
    required this.items,
  });

  final String key;
  final String title;
  final IconData icon;
  final List<_ExtendedItem> items;
}

class _ExtendedItem {
  const _ExtendedItem({
    this.title = '',
    this.subtitle = '',
    this.period = '',
    this.description = '',
    this.link = '',
  });

  final String title;
  final String subtitle;
  final String period;
  final String description;
  final String link;

  bool get hasContent =>
      title.isNotEmpty ||
      subtitle.isNotEmpty ||
      period.isNotEmpty ||
      description.isNotEmpty ||
      link.isNotEmpty;
}

/// Extract an HTTP status from an error (ApiException via DioException).
int? _statusOf(Object e) {
  if (e is ApiException) return e.statusCode;
  if (e is DioException) {
    final inner = e.error;
    if (inner is ApiException) return inner.statusCode;
    return e.response?.statusCode;
  }
  return null;
}
