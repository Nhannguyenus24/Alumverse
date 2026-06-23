import 'package:cached_network_image/cached_network_image.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_widget_from_html_core/flutter_widget_from_html_core.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/utils/image_url.dart';
import '../../../../shared/widgets/error_view.dart';
import '../../data/models/organization_introduction.dart';
import '../providers/organization_provider.dart';

/// Organization introduction (view-only) — native port of the web
/// `IntroducePage`. Banner + HTML content + vision/mission/core values + photos.
class OrganizationIntroductionPage extends ConsumerWidget {
  const OrganizationIntroductionPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final org = ref.watch(organizationStateProvider).valueOrNull;

    return Scaffold(
      appBar: AppBar(title: Text('organization.introduction'.tr())),
      body: org == null
          ? ErrorView(message: 'organization.not_found'.tr())
          : ref.watch(organizationIntroductionProvider(org.id)).when(
                loading: () =>
                    const Center(child: CircularProgressIndicator()),
                error: (_, __) => ErrorView(
                  message: 'organization.intro_load_failed'.tr(),
                  onRetry: () => ref
                      .invalidate(organizationIntroductionProvider(org.id)),
                ),
                data: (intro) => _Content(intro: intro, orgName: org.name),
              ),
    );
  }
}

class _Content extends StatelessWidget {
  const _Content({required this.intro, required this.orgName});

  final OrganizationIntroduction intro;
  final String orgName;

  @override
  Widget build(BuildContext context) {
    final banner = resolveImageUrl(intro.bannerUrl);

    if (intro.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Text(
            'organization.intro_empty'.tr(),
            textAlign: TextAlign.center,
            style: const TextStyle(color: AppColors.textSecondary),
          ),
        ),
      );
    }

    return ListView(
      padding: EdgeInsets.zero,
      children: [
        if (banner != null)
          CachedNetworkImage(
            imageUrl: banner,
            height: 200,
            width: double.infinity,
            fit: BoxFit.cover,
            placeholder: (_, __) =>
                Container(height: 200, color: AppColors.divider),
            errorWidget: (_, __, ___) =>
                Container(height: 200, color: AppColors.divider),
          ),
        Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'organization.introduction_upper'.tr(),
                style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                      fontWeight: FontWeight.w800,
                      color: AppColors.primary,
                    ),
              ),
              const SizedBox(height: 4),
              Text(
                orgName,
                style: const TextStyle(
                    color: AppColors.textSecondary, fontSize: 14),
              ),
              const SizedBox(height: 16),
              if (intro.content != null && intro.content!.isNotEmpty)
                HtmlWidget(
                  intro.content!,
                  textStyle: const TextStyle(fontSize: 15, height: 1.6),
                  customWidgetBuilder: (element) {
                    if (element.localName != 'img') return null;
                    final src = resolveImageUrl(element.attributes['src']);
                    if (src == null) return const SizedBox.shrink();
                    return Padding(
                      padding: const EdgeInsets.symmetric(vertical: 8),
                      child: CachedNetworkImage(
                        imageUrl: src,
                        fit: BoxFit.contain,
                        errorWidget: (_, __, ___) => const SizedBox.shrink(),
                      ),
                    );
                  },
                ),
              if (intro.vision != null && intro.vision!.isNotEmpty)
                _InfoBlock(title: 'organization.vision'.tr(), body: intro.vision!),
              if (intro.mission != null && intro.mission!.isNotEmpty)
                _InfoBlock(title: 'organization.mission'.tr(), body: intro.mission!),
              if (intro.coreValues != null && intro.coreValues!.isNotEmpty)
                _InfoBlock(title: 'organization.core_values'.tr(), body: intro.coreValues!),
              if (intro.imageUrls.isNotEmpty) ...[
                const SizedBox(height: 20),
                Text(
                  'organization.activity_photos'.tr(),
                  style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
                ),
                const SizedBox(height: 12),
                GridView.builder(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: intro.imageUrls.length,
                  gridDelegate:
                      const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 2,
                    mainAxisSpacing: 10,
                    crossAxisSpacing: 10,
                    childAspectRatio: 1.3,
                  ),
                  itemBuilder: (_, i) {
                    final url = resolveImageUrl(intro.imageUrls[i]);
                    return ClipRRect(
                      borderRadius: BorderRadius.circular(8),
                      child: url != null
                          ? CachedNetworkImage(
                              imageUrl: url,
                              fit: BoxFit.cover,
                              placeholder: (_, __) =>
                                  Container(color: AppColors.divider),
                              errorWidget: (_, __, ___) =>
                                  Container(color: AppColors.divider),
                            )
                          : Container(color: AppColors.divider),
                    );
                  },
                ),
              ],
            ],
          ),
        ),
        const SizedBox(height: 24),
      ],
    );
  }
}

class _InfoBlock extends StatelessWidget {
  const _InfoBlock({required this.title, required this.body});

  final String title;
  final String body;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(top: 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: const TextStyle(
              color: AppColors.primary,
              fontSize: 16,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            body,
            style: const TextStyle(
                fontSize: 14, height: 1.7, color: AppColors.textSecondary),
          ),
        ],
      ),
    );
  }
}
