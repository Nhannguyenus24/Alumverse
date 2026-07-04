import 'package:cached_network_image/cached_network_image.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/utils/image_url.dart';
import '../../data/models/user_profile.dart';
import '../providers/user_providers.dart';

/// Public profile of another member. Mirrors the web page
/// (`/:slug/profile/:id`, `PublicUserProfile.jsx` + `ProfileLayout`):
/// cover banner + overlapping avatar + name/role, an "About" card and a
/// "Basic info" grid. Same endpoint/DTO as web — no backend change.
class PublicProfilePage extends ConsumerWidget {
  const PublicProfilePage({super.key, required this.userId});

  final int userId;

  /// Same fallback cover the web uses (`DEFAULT_COVER`).
  static const String _defaultCover =
      'https://ethnasia.com/cdn/shop/articles/sean-o-KMn4VEeEPR8-unsplash_edited.jpg?v=1621585619';

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(publicProfileProvider(userId));

    return Scaffold(
      backgroundColor: AppColors.background,
      body: async.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error:
            (e, _) => _ErrorView(
              onRetry: () => ref.invalidate(publicProfileProvider(userId)),
            ),
        data: (profile) => _ProfileBody(profile: profile),
      ),
    );
  }
}

class _ProfileBody extends StatelessWidget {
  const _ProfileBody({required this.profile});

  final UserProfile profile;

  @override
  Widget build(BuildContext context) {
    final avatar = resolveImageUrl(profile.avatarUrl);
    final name =
        profile.fullName?.isNotEmpty == true
            ? profile.fullName!
            : 'User #${profile.userId}';
    // Web role = `currentJobTitle @ currentCompany` || 'Member'. Those
    // fields are not in the DTO, so this always shows 'Member' (same as web).
    final role = 'profile.member'.tr();

    return SingleChildScrollView(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // ===== COVER + AVATAR =====
          Stack(
            clipBehavior: Clip.none,
            alignment: Alignment.center,
            children: [
              Container(
                height: 160,
                width: double.infinity,
                decoration: const BoxDecoration(
                  image: DecorationImage(
                    image: CachedNetworkImageProvider(
                      PublicProfilePage._defaultCover,
                    ),
                    fit: BoxFit.cover,
                  ),
                ),
              ),
              // Back button overlaid on the cover.
              Positioned(
                top: MediaQuery.of(context).padding.top + 4,
                left: 4,
                child: CircleAvatar(
                  backgroundColor: Colors.black.withValues(alpha: 0.35),
                  child: IconButton(
                    icon: const Icon(Icons.arrow_back, color: Colors.white),
                    onPressed: () => Navigator.of(context).maybePop(),
                  ),
                ),
              ),
              // Avatar overlapping the bottom of the cover.
              Positioned(
                bottom: -50,
                child: CircleAvatar(
                  radius: 54,
                  backgroundColor: Colors.white,
                  child: CircleAvatar(
                    radius: 50,
                    backgroundColor: AppColors.primaryLighter,
                    backgroundImage:
                        avatar != null
                            ? CachedNetworkImageProvider(avatar)
                            : null,
                    child:
                        avatar == null
                            ? const Icon(
                              Icons.person,
                              size: 54,
                              color: AppColors.primary,
                            )
                            : null,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 60),

          // ===== NAME + ROLE =====
          Center(
            child: Text(
              name,
              style: const TextStyle(
                fontSize: 22,
                fontWeight: FontWeight.w800,
                color: AppColors.textPrimary,
              ),
              textAlign: TextAlign.center,
            ),
          ),
          const SizedBox(height: 4),
          Center(
            child: Text(
              role,
              style: const TextStyle(
                color: AppColors.primary,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
          const SizedBox(height: 24),

          // ===== BIO SECTION =====
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: _SectionCard(
              icon: Icons.person_outline,
              title: 'profile.bio'.tr(),
              child: Text(
                profile.bio?.trim().isNotEmpty == true
                    ? profile.bio!.trim()
                    : 'profile.bio_empty'.tr(),
                style: TextStyle(
                  height: 1.6,
                  fontStyle:
                      profile.bio?.trim().isNotEmpty == true
                          ? FontStyle.normal
                          : FontStyle.italic,
                  color:
                      profile.bio?.trim().isNotEmpty == true
                          ? AppColors.textPrimary
                          : AppColors.textSecondary,
                ),
              ),
            ),
          ),
          const SizedBox(height: 8),

          // ===== BASIC INFO SECTION =====
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
            child: Row(
              children: [
                const Icon(Icons.badge_outlined, color: AppColors.primary),
                const SizedBox(width: 8),
                Text(
                  'profile.basic_info'.tr(),
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w800,
                    color: AppColors.primary,
                  ),
                ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 24),
            child: Column(
              children: [
                _InfoTile(
                  icon: Icons.person_outline,
                  label: 'profile.full_name'.tr().toUpperCase(),
                  value: profile.fullName,
                ),
                if (profile.email.isNotEmpty)
                  _InfoTile(
                    icon: Icons.email_outlined,
                    label: 'profile.email'.tr().toUpperCase(),
                    value: profile.email,
                  ),
                _InfoTile(
                  icon: Icons.work_outline,
                  label: 'profile.current_job'.tr().toUpperCase(),
                  value: null,
                ),
                _InfoTile(
                  icon: Icons.business_outlined,
                  label: 'profile.company'.tr().toUpperCase(),
                  value: null,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

/// A titled card (matches the web "About" card).
class _SectionCard extends StatelessWidget {
  const _SectionCard({
    required this.icon,
    required this.title,
    required this.child,
  });

  final IconData icon;
  final String title;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.divider),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, color: AppColors.primary, size: 22),
              const SizedBox(width: 8),
              Text(
                title,
                style: const TextStyle(
                  fontWeight: FontWeight.w800,
                  fontSize: 18,
                  color: AppColors.primary,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          child,
        ],
      ),
    );
  }
}

/// An info card with icon + label + value (mirrors web `ProfileItem`).
class _InfoTile extends StatelessWidget {
  const _InfoTile({
    required this.icon,
    required this.label,
    required this.value,
  });

  final IconData icon;
  final String label;
  final String? value;

  @override
  Widget build(BuildContext context) {
    final hasValue = value != null && value!.trim().isNotEmpty;
    return Container(
      width: double.infinity,
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.divider),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: AppColors.primaryLighter,
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(icon, color: AppColors.primary, size: 20),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: const TextStyle(
                    color: AppColors.textSecondary,
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    letterSpacing: 0.5,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  hasValue ? value!.trim() : 'profile.not_updated'.tr(),
                  style: TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w600,
                    color:
                        hasValue
                            ? AppColors.textPrimary
                            : AppColors.textSecondary,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _ErrorView extends StatelessWidget {
  const _ErrorView({required this.onRetry});

  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(Icons.error_outline, size: 48, color: AppColors.error),
          const SizedBox(height: 12),
          Text(
            'profile.load_failed'.tr(),
            style: const TextStyle(color: AppColors.textSecondary),
          ),
          const SizedBox(height: 12),
          ElevatedButton(onPressed: onRetry, child: Text('common.retry'.tr())),
        ],
      ),
    );
  }
}
