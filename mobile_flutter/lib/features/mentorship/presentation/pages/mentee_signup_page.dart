import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../shared/widgets/app_toast.dart';
import '../../data/models/mentee_profile.dart';
import '../../data/repositories/mentorship_repository.dart';
import '../providers/mentorship_providers.dart';

const List<String> _kAcademicYearKeys = [
  'mentorship.mentee_year_1',
  'mentorship.mentee_year_2',
  'mentorship.mentee_year_3',
  'mentorship.mentee_year_4',
  'mentorship.mentee_year_5plus',
  'mentorship.mentee_year_graduated',
];

const List<String> _kCommitmentKeys = [
  'mentorship.mentee_commitment_1',
  'mentorship.mentee_commitment_2',
  'mentorship.mentee_commitment_3',
  'mentorship.mentee_commitment_4',
  'mentorship.mentee_commitment_5',
];

class MenteeSignupPage extends ConsumerStatefulWidget {
  const MenteeSignupPage({super.key});

  @override
  ConsumerState<MenteeSignupPage> createState() => _MenteeSignupPageState();
}

class _MenteeSignupPageState extends ConsumerState<MenteeSignupPage> {
  final _formKey = GlobalKey<FormState>();
  final _goalCtl = TextEditingController();
  final _majorCtl = TextEditingController();
  final _interestsCtl = TextEditingController();

  String? _academicYear;
  bool _termsAccepted = false;
  bool _submitting = false;
  bool _hydrated = false;

  @override
  void dispose() {
    _goalCtl.dispose();
    _majorCtl.dispose();
    _interestsCtl.dispose();
    super.dispose();
  }

  void _hydrate(MenteeProfile? profile) {
    if (_hydrated || profile == null) return;
    _hydrated = true;
    _goalCtl.text = profile.mentoringGoal;
    _majorCtl.text = profile.major;
    _interestsCtl.text = profile.interests ?? '';
    _academicYear = profile.academicYear;
    _termsAccepted = true;
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    if (_academicYear == null || _academicYear!.isEmpty) {
      AppToast.info(context, 'mentorship.mentee_signup_year_required'.tr());
      return;
    }
    if (!_termsAccepted) {
      AppToast.info(context, 'mentorship.signup_terms_required'.tr());
      return;
    }

    setState(() => _submitting = true);
    try {
      final repo = ref.read(mentorshipRepositoryProvider);
      await repo.createOrUpdateMenteeProfile(
        mentoringGoal: _goalCtl.text.trim(),
        major: _majorCtl.text.trim(),
        academicYear: _academicYear!,
        interests: _interestsCtl.text.trim(),
        termsAccepted: true,
      );
      ref.invalidate(myMenteeProfileProvider);
      if (!mounted) return;
      AppToast.success(context, 'mentorship.mentee_signup_success'.tr());
      Navigator.of(context).pop();
    } catch (e) {
      if (!mounted) return;
      AppToast.fromError(
        context,
        e,
        fallback: 'mentorship.mentee_signup_failed'.tr(),
      );
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final accessAsync = ref.watch(mentorshipAccessProvider);
    final mentorProfileAsync = ref.watch(myMentorProfileProvider);

    if (accessAsync.isLoading || mentorProfileAsync.isLoading) {
      return Scaffold(
        appBar: AppBar(title: Text('mentorship.become_mentee'.tr())),
        body: const Center(child: CircularProgressIndicator()),
      );
    }

    final access = accessAsync.valueOrNull;
    if (access == null || !access.canParticipateInMentorship) {
      final verificationLevel = access?.verificationLevel ?? 0;
      final isManager = access?.isOrgManager ?? false;
      final needsEmail = verificationLevel < 1;
      return Scaffold(
        appBar: AppBar(title: Text('mentorship.become_mentee'.tr())),
        body: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              TextButton.icon(
                onPressed: () => Navigator.of(context).pop(),
                icon: const Icon(Icons.arrow_back),
                label: Text('mentorship.mentee_signup_go_back'.tr()),
              ),
              const SizedBox(height: 8),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: (isManager ? AppColors.info : Colors.amber)
                      .withValues(alpha: 0.12),
                  border: Border.all(
                    color: isManager ? AppColors.info : Colors.amber,
                  ),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      isManager
                          ? 'mentorship.manager_signup_locked_title'.tr()
                          : 'mentorship.mentee_signup_not_eligible_title'.tr(),
                      style: const TextStyle(fontWeight: FontWeight.w700),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      isManager
                          ? 'mentorship.manager_signup_locked_desc'.tr()
                          : needsEmail
                              ? 'mentorship.mentee_signup_not_eligible_email'
                                  .tr()
                              : 'mentorship.mentee_signup_not_eligible_academic'
                                  .tr(),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      );
    }

    final mentorStatus =
        (mentorProfileAsync.valueOrNull?.status ?? '').toUpperCase();
    if (mentorStatus == 'PENDING') {
      return Scaffold(
        appBar: AppBar(title: Text('mentorship.become_mentee'.tr())),
        body: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              TextButton.icon(
                onPressed: () => Navigator.of(context).pop(),
                icon: const Icon(Icons.arrow_back),
                label: Text('mentorship.mentee_signup_go_back'.tr()),
              ),
              const SizedBox(height: 8),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppColors.info.withValues(alpha: 0.12),
                  border: Border.all(color: AppColors.info),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'mentorship.mentor_signup_pending_title'.tr(),
                      style: const TextStyle(fontWeight: FontWeight.w700),
                    ),
                    const SizedBox(height: 6),
                    Text('mentorship.mentor_signup_pending_desc'.tr()),
                  ],
                ),
              ),
            ],
          ),
        ),
      );
    }

    final profileAsync = ref.watch(myMenteeProfileProvider);
    final hasExisting = profileAsync.value != null;
    profileAsync.whenData(_hydrate);

    return Scaffold(
      appBar: AppBar(title: Text('mentorship.become_mentee'.tr())),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            Text(
              hasExisting
                  ? 'mentorship.mentee_signup_update_heading'.tr()
                  : 'mentorship.mentee_signup_create_heading'.tr(),
              style: const TextStyle(
                fontWeight: FontWeight.w800,
                fontSize: 20,
                color: AppColors.primary,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              'mentorship.mentee_signup_subtitle'.tr(),
              style: const TextStyle(color: AppColors.textSecondary),
            ),
            const SizedBox(height: 20),
            TextFormField(
              controller: _goalCtl,
              maxLines: 3,
              decoration: InputDecoration(
                labelText: 'mentorship.mentee_goal_label'.tr(),
                hintText: 'mentorship.mentee_goal_hint'.tr(),
              ),
              validator:
                  (v) =>
                      (v == null || v.trim().isEmpty)
                          ? 'mentorship.mentee_goal_required'.tr()
                          : null,
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _majorCtl,
              decoration: InputDecoration(
                labelText: 'mentorship.mentee_major_label'.tr(),
              ),
              validator:
                  (v) =>
                      (v == null || v.trim().isEmpty)
                          ? 'mentorship.mentee_major_required'.tr()
                          : null,
            ),
            const SizedBox(height: 16),
            DropdownButtonFormField<String>(
              initialValue: _academicYear,
              decoration: InputDecoration(
                labelText: 'mentorship.mentee_year_label'.tr(),
              ),
              items:
                  _kAcademicYearKeys
                      .map(
                        (key) => DropdownMenuItem(
                          value: key.tr(),
                          child: Text(key.tr()),
                        ),
                      )
                      .toList(),
              onChanged: (v) => setState(() => _academicYear = v),
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _interestsCtl,
              maxLines: 2,
              decoration: InputDecoration(
                labelText: 'mentorship.mentee_interests_label'.tr(),
                hintText: 'mentorship.mentee_interests_hint'.tr(),
                helperText: 'mentorship.mentee_interests_helper'.tr(),
              ),
            ),
            const SizedBox(height: 24),
            Text(
              'mentorship.mentee_terms_title'.tr(),
              style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15),
            ),
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.all(12),
              constraints: const BoxConstraints(maxHeight: 220),
              decoration: BoxDecoration(
                border: Border.all(color: AppColors.divider),
                borderRadius: BorderRadius.circular(10),
              ),
              child: SingleChildScrollView(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'mentorship.mentee_terms_agree_header'.tr(),
                      style: const TextStyle(color: AppColors.textSecondary),
                    ),
                    const SizedBox(height: 6),
                    for (final key in _kCommitmentKeys)
                      Padding(
                        padding: const EdgeInsets.only(bottom: 4),
                        child: Text('•  ${key.tr()}'),
                      ),
                  ],
                ),
              ),
            ),
            CheckboxListTile(
              contentPadding: EdgeInsets.zero,
              value: _termsAccepted,
              onChanged: (v) => setState(() => _termsAccepted = v ?? false),
              title: Text('mentorship.mentee_terms_accept_label'.tr()),
              controlAffinity: ListTileControlAffinity.leading,
            ),
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: _submitting ? null : _submit,
                child:
                    _submitting
                        ? const SizedBox(
                          height: 20,
                          width: 20,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: Colors.white,
                          ),
                        )
                        : Text(
                          hasExisting
                              ? 'mentorship.mentee_signup_update_btn'.tr()
                              : 'mentorship.mentee_signup_complete_btn'.tr(),
                        ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
