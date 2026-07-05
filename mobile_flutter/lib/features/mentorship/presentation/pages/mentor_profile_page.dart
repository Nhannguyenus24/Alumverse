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
                    const SizedBox(height: 12),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton.icon(
                        onPressed:
                            () => context.push(
                              '${RouteNames.mentorship}/mentors/${widget.memberId}/book',
                            ),
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
                ),
              ),
              // ── Tab content ─────────────────────────────────────────
              Expanded(
                child: TabBarView(
                  controller: _tabCtrl,
                  children: [
                    // Tab 1: Info
                    Builder(
                      builder: (_) {
                        final tags = {
                          ...m.expertiseTags,
                          ...m.expertiseTopics,
                        }.toList();
                        return ListView(
                          padding: const EdgeInsets.all(16),
                          children: [
                            if (tags.isNotEmpty) ...[
                              _SectionLabel('mentorship.expertise'.tr()),
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
                                            ),
                                            side: BorderSide.none,
                                          ),
                                        )
                                        .toList(),
                              ),
                            ],
                          ],
                        );
                      },
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

class _SectionLabel extends StatelessWidget {
  const _SectionLabel(this.text);
  final String text;

  @override
  Widget build(BuildContext context) {
    return Text(
      text.toUpperCase(),
      style: const TextStyle(
        color: AppColors.primary,
        fontWeight: FontWeight.w700,
        fontSize: 12,
        letterSpacing: 0.5,
      ),
    );
  }
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
