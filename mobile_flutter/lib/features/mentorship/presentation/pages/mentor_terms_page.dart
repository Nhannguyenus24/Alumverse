import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';

import '../../../../core/theme/app_colors.dart';

const List<String> _kTermsCommitmentKeys = [
  'mentorship.signup_terms_commitment_1',
  'mentorship.signup_terms_commitment_2',
  'mentorship.signup_terms_commitment_3',
  'mentorship.signup_terms_commitment_4',
  'mentorship.signup_terms_commitment_5',
  'mentorship.signup_terms_commitment_6',
];

/// Read-only page showing the full mentor-program terms. Opened from the
/// "become a mentor" signup screen's terms link.
class MentorTermsPage extends StatelessWidget {
  const MentorTermsPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('mentorship.signup_terms_page_title'.tr())),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Text(
            'mentorship.signup_terms_title'.tr(),
            style: const TextStyle(
              fontWeight: FontWeight.w800,
              fontSize: 18,
              color: AppColors.primary,
            ),
          ),
          const SizedBox(height: 12),
          Text(
            'mentorship.signup_terms_intro'.tr(),
            style: const TextStyle(height: 1.5),
          ),
          const SizedBox(height: 16),
          Text(
            'mentorship.signup_terms_agree_header'.tr(),
            style: const TextStyle(fontWeight: FontWeight.w700),
          ),
          const SizedBox(height: 8),
          for (var i = 0; i < _kTermsCommitmentKeys.length; i++)
            Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    '${i + 1}.  ',
                    style: const TextStyle(fontWeight: FontWeight.w700),
                  ),
                  Expanded(
                    child: Text(
                      _kTermsCommitmentKeys[i].tr(),
                      style: const TextStyle(height: 1.5),
                    ),
                  ),
                ],
              ),
            ),
          const SizedBox(height: 8),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: AppColors.error.withValues(alpha: 0.08),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Text(
              'mentorship.signup_terms_penalty'.tr(),
              style: const TextStyle(height: 1.5),
            ),
          ),
        ],
      ),
    );
  }
}
