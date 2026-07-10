import 'dart:convert';
import 'dart:io';

import 'package:easy_localization/easy_localization.dart';
import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/router/route_names.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../shared/widgets/app_toast.dart';
import '../../../user/data/models/user_profile.dart';
import '../../../user/presentation/providers/user_providers.dart';
import '../../data/models/mentee_profile.dart';
import '../../data/models/mentor_profile.dart';
import '../../data/repositories/mentorship_repository.dart';
import '../providers/mentorship_providers.dart';

const int _kMinVerificationLevel = 2;

/// A generic key/value draft row used by the education/experience/projects/
/// awards/skills section lists — mirrors the web `SectionList` component,
/// which stores each item as a plain map keyed by field name.
class _EntryDraft {
  _EntryDraft(this.values);
  final Map<String, String> values;

  Map<String, dynamic> toJson() => values;
}

/// Become a mentor — native take on the web `MentorshipSignupPage`. Collects
/// profile fields, shareable content, extracted skill tags and extended
/// profile sections. Mentor profiles start as PENDING (admin approval).
/// A CV (PDF) can be uploaded to auto-fill most of the fields below via OCR +
/// Gemini (see MentorshipCvController on the backend).
class MentorSignupPage extends ConsumerStatefulWidget {
  const MentorSignupPage({super.key});

  @override
  ConsumerState<MentorSignupPage> createState() => _MentorSignupPageState();
}

class _MentorSignupPageState extends ConsumerState<MentorSignupPage> {
  final _formKey = GlobalKey<FormState>();
  final _jobCtl = TextEditingController();
  final _companyCtl = TextEditingController();
  final _meetingCtl = TextEditingController();
  final _summaryCtl = TextEditingController();
  final _manualTagCtl = TextEditingController();

  final List<_EntryDraft> _educations = [];
  final List<_EntryDraft> _experiences = [];
  final List<_EntryDraft> _projects = [];
  final List<_EntryDraft> _awards = [];
  final List<_EntryDraft> _skills = [];
  final List<String> _expertiseTags = [];

  bool _termsAccepted = false;
  bool _submitting = false;
  bool _savingDraft = false;
  bool _cvExtracting = false;
  String? _cvFileName;
  String? _cvExtractError;
  bool _tagsExtracting = false;
  bool _tagsExtractAttempted = false;
  String? _tagsExtractError;
  String? _hydratedProfileKey;
  String? _hydratedAccountKey;

  @override
  void dispose() {
    _jobCtl.dispose();
    _companyCtl.dispose();
    _meetingCtl.dispose();
    _summaryCtl.dispose();
    _manualTagCtl.dispose();
    super.dispose();
  }

  void _addTags(Iterable<String> incoming) {
    final existing = _expertiseTags.map((t) => t.toLowerCase()).toSet();
    for (final raw in incoming) {
      final v = raw
          .trim()
          .replaceFirst(RegExp(r'^#+'), '')
          .replaceAll(RegExp(r'\s+'), '_');
      if (v.isNotEmpty && !existing.contains(v.toLowerCase())) {
        existing.add(v.toLowerCase());
        setState(() => _expertiseTags.add(v));
      }
    }
  }

  void _removeTag(String tag) {
    setState(() => _expertiseTags.remove(tag));
  }

  void _handleManualAddTag() {
    final v = _manualTagCtl.text.trim();
    if (v.isEmpty) return;
    _addTags([v]);
    _manualTagCtl.clear();
  }

  Future<void> _extractTags() async {
    final text = _summaryCtl.text.trim();
    if (text.isEmpty) return;
    setState(() {
      _tagsExtracting = true;
      _tagsExtractError = null;
    });
    try {
      final repo = ref.read(mentorshipRepositoryProvider);
      final tags = await repo.extractSkillTags(text);
      if (!mounted) return;
      if (tags.isEmpty) {
        setState(
          () => _tagsExtractError = 'mentorship.signup_tab_extract_empty'.tr(),
        );
      } else {
        _addTags(tags);
      }
    } catch (e) {
      if (!mounted) return;
      setState(
        () => _tagsExtractError = 'mentorship.signup_tab_extract_error'.tr(),
      );
    } finally {
      if (mounted) {
        setState(() {
          _tagsExtracting = false;
          _tagsExtractAttempted = true;
        });
      }
    }
  }

  Future<void> _pickCv() async {
    final result = await FilePicker.platform.pickFiles(
      type: FileType.custom,
      allowedExtensions: ['pdf'],
      withData: true,
    );
    final picked = result?.files.firstOrNull;
    if (picked == null) return;

    setState(() {
      _cvFileName = picked.name;
      _cvExtractError = null;
    });

    if (!picked.name.toLowerCase().endsWith('.pdf')) {
      setState(() => _cvExtractError = 'mentorship.signup_cv_pdf_only'.tr());
      return;
    }

    setState(() => _cvExtracting = true);
    try {
      final bytes = picked.bytes ?? await File(picked.path!).readAsBytes();
      final base64File = base64Encode(bytes);
      final repo = ref.read(mentorshipRepositoryProvider);
      final profile = await repo.extractCv(
        base64File: base64File,
        originalFileName: picked.name,
      );
      if (!mounted) return;
      _applyExtractedProfile(profile);
    } catch (e) {
      if (!mounted) return;
      setState(
        () => _cvExtractError = 'mentorship.signup_cv_extract_error'.tr(),
      );
    } finally {
      if (mounted) setState(() => _cvExtracting = false);
    }
  }

  void _applyExtractedProfile(Map<String, dynamic> profile) {
    setState(() {
      final jobTitle = profile['currentJobTitle'] as String?;
      if (jobTitle != null && jobTitle.trim().isNotEmpty) {
        _jobCtl.text = jobTitle;
      }
      final company = profile['currentCompany'] as String?;
      if (company != null && company.trim().isNotEmpty) {
        _companyCtl.text = company;
      }
      final bio = profile['bio'] as String?;
      if (bio != null && bio.trim().isNotEmpty) {
        _summaryCtl.text = bio;
      }

      _mergeEntries(_educations, profile['educations'], [
        'school',
        'degree',
        'period',
      ]);
      _mergeEntries(_experiences, profile['experiences'], [
        'title',
        'company',
        'period',
        'description',
      ]);
      _mergeEntries(_projects, profile['projects'], [
        'name',
        'description',
        'link',
      ]);
      _mergeEntries(_awards, profile['awards'], [
        'name',
        'year',
        'description',
      ]);
      _mergeEntries(_skills, profile['skills'], ['name', 'issuer']);

      // Merge CV-detected skill tags into the same priority-ordered list as
      // the description extraction (ME-02) so both sources feed one tag list
      // reviewed/reordered by the mentor below.
      final cvTags = profile['expertiseTags'];
      if (cvTags is List) {
        _addTags(cvTags.whereType<String>());
      }
    });
  }

  void _hydrateFromExistingProfile(MentorProfile? profile) {
    if (profile == null) return;
    final status = (profile.status ?? '').toUpperCase();
    if (status != 'DRAFT' && status != 'REJECTED' && status != 'NEED_UPDATE') {
      return;
    }

    final hydrateKey = [
      profile.memberId,
      status,
      profile.currentJobTitle ?? '',
      profile.currentCompany ?? '',
      profile.defaultMeetingLink ?? '',
      profile.extendedProfile ?? '',
      profile.expertiseTags.join('|'),
    ].join('::');
    if (_hydratedProfileKey == hydrateKey) return;
    _hydratedProfileKey = hydrateKey;

    Map<String, dynamic> extended = {};
    final rawExtended = profile.extendedProfile;
    if (rawExtended != null && rawExtended.trim().isNotEmpty) {
      try {
        final decoded = jsonDecode(rawExtended);
        if (decoded is Map<String, dynamic>) {
          extended = decoded;
        } else if (decoded is Map) {
          extended = decoded.map((key, value) => MapEntry('$key', value));
        }
      } catch (_) {
        extended = {};
      }
    }

    _jobCtl.text = profile.currentJobTitle ?? '';
    _companyCtl.text = profile.currentCompany ?? '';
    _meetingCtl.text = profile.defaultMeetingLink ?? '';
    _summaryCtl.text =
        (extended['experienceSummary'] as String?) ?? profile.bio ?? '';

    _replaceEntries(_educations, extended['educations'], [
      'school',
      'degree',
      'period',
    ]);
    _replaceEntries(_experiences, extended['experiences'], [
      'title',
      'company',
      'period',
      'description',
    ]);
    _replaceEntries(_projects, extended['projects'], [
      'name',
      'description',
      'link',
    ]);
    _replaceEntries(_awards, extended['awards'], [
      'name',
      'year',
      'description',
    ]);
    _replaceEntries(_skills, extended['skills'], ['name', 'issuer']);

    final tags = <String>[
      ...profile.expertiseTags,
      if (extended['expertiseTags'] is List)
        ...(extended['expertiseTags'] as List).map((e) => '$e'),
    ];
    _expertiseTags
      ..clear()
      ..addAll(_dedupeTags(tags));

    _tagsExtractAttempted = _expertiseTags.isNotEmpty;
  }

  void _hydrateFromAccount({
    required UserProfile? profile,
    required MenteeProfile? mentee,
  }) {
    if (_hydratedProfileKey != null || (profile == null && mentee == null)) {
      return;
    }

    final hydrateKey = [
      'account',
      profile?.userId ?? '',
      profile?.bio ?? '',
      profile?.organizationName ?? '',
      profile?.startedYear.join('|') ?? '',
      profile?.graduatedYear.join('|') ?? '',
      profile?.program.join('|') ?? '',
      profile?.major.join('|') ?? '',
      profile?.faculty.join('|') ?? '',
      profile?.department.join('|') ?? '',
      mentee?.memberId ?? '',
      mentee?.mentoringGoal ?? '',
      mentee?.interests ?? '',
    ].join('::');
    if (_hydratedAccountKey == hydrateKey) return;
    _hydratedAccountKey = hydrateKey;

    if (_summaryCtl.text.trim().isEmpty) {
      _summaryCtl.text = _firstNonEmpty([profile?.bio, mentee?.mentoringGoal]);
    }

    if (_educations.isEmpty && profile != null) {
      _educations.addAll(_buildAcademicRows(profile));
    }

    final interests = _splitCsv(mentee?.interests);
    if (_expertiseTags.isEmpty && interests.isNotEmpty) {
      _expertiseTags.addAll(interests);
      _tagsExtractAttempted = true;
    }

    if (_skills.isEmpty && interests.isNotEmpty) {
      _skills.addAll(
        interests.map((name) => _EntryDraft({'name': name, 'issuer': ''})),
      );
    }
  }

  /// Replaces [target] with entries from the AI response when it returned
  /// any — otherwise leaves what the user already typed untouched.
  void _mergeEntries(
    List<_EntryDraft> target,
    dynamic rawList,
    List<String> keys,
  ) {
    if (rawList is! List || rawList.isEmpty) return;
    target.clear();
    for (final raw in rawList) {
      if (raw is! Map) continue;
      final values = <String, String>{
        for (final key in keys) key: (raw[key] as String?) ?? '',
      };
      target.add(_EntryDraft(values));
    }
  }

  void _replaceEntries(
    List<_EntryDraft> target,
    dynamic rawList,
    List<String> keys,
  ) {
    target.clear();
    if (rawList is! List) return;
    for (final raw in rawList) {
      if (raw is! Map) continue;
      final values = <String, String>{
        for (final key in keys) key: (raw[key]?.toString()) ?? '',
      };
      if (values.values.any((v) => v.trim().isNotEmpty)) {
        target.add(_EntryDraft(values));
      }
    }
  }

  List<String> _dedupeTags(Iterable<String> tags) {
    final seen = <String>{};
    final result = <String>[];
    for (final raw in tags) {
      final tag = raw.trim();
      final key = tag.toLowerCase();
      if (tag.isNotEmpty && seen.add(key)) {
        result.add(tag);
      }
    }
    return result;
  }

  List<String> _splitCsv(String? raw) {
    if (raw == null || raw.trim().isEmpty) return const [];
    return _dedupeTags(
      raw
          .split(',')
          .map((item) => item.trim())
          .where((item) => item.isNotEmpty),
    );
  }

  String _firstNonEmpty(Iterable<String?> values) {
    for (final value in values) {
      final trimmed = value?.trim();
      if (trimmed != null && trimmed.isNotEmpty) return trimmed;
    }
    return '';
  }

  List<_EntryDraft> _buildAcademicRows(UserProfile profile) {
    final maxLength = [
      profile.faculty.length,
      profile.department.length,
      profile.program.length,
      profile.major.length,
      profile.startedYear.length,
      profile.graduatedYear.length,
    ].fold<int>(0, (max, length) => length > max ? length : max);
    if (maxLength == 0 && profile.organizationName == null) return const [];

    return List.generate(maxLength == 0 ? 1 : maxLength, (index) {
          String at(List<String> values) =>
              index < values.length ? values[index].trim() : '';
          final school = _firstNonEmpty([
            at(profile.faculty),
            at(profile.department),
            profile.organizationName,
          ]);
          final major = at(profile.major);
          final program = at(profile.program);
          final degree = [
            if (major.isNotEmpty) 'Cử nhân $major',
            if (program.isNotEmpty) 'Chương trình $program',
          ].join(' - ');
          final period = [
            at(profile.startedYear),
            at(profile.graduatedYear),
          ].where((value) => value.isNotEmpty).join(' - ');
          return _EntryDraft({
            'school': school,
            'degree': degree,
            'period': period,
          });
        })
        .where((row) => row.values.values.any((v) => v.trim().isNotEmpty))
        .toList();
  }

  String _buildExtendedProfile() {
    return jsonEncode({
      'experienceSummary': _summaryCtl.text.trim(),
      'expertiseTags': _expertiseTags,
      'educations': _educations.map((e) => e.toJson()).toList(),
      'experiences': _experiences.map((e) => e.toJson()).toList(),
      'projects': _projects.map((e) => e.toJson()).toList(),
      'awards': _awards.map((e) => e.toJson()).toList(),
      'skills': _skills.map((e) => e.toJson()).toList(),
    });
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    if (_expertiseTags.isEmpty) {
      AppToast.info(context, 'mentorship.signup_tab_extract_empty'.tr());
      return;
    }
    if (_educations.isEmpty) {
      AppToast.info(context, 'mentorship.signup_education_required'.tr());
      return;
    }
    if (_experiences.isEmpty) {
      AppToast.info(context, 'mentorship.signup_experience_required'.tr());
      return;
    }
    if (!_termsAccepted) {
      AppToast.info(context, 'mentorship.signup_terms_required'.tr());
      return;
    }

    setState(() => _submitting = true);
    try {
      final repo = ref.read(mentorshipRepositoryProvider);
      await repo.createMentorProfile(
        currentJobTitle: _jobCtl.text.trim(),
        currentCompany: _companyCtl.text.trim(),
        defaultMeetingLink: _meetingCtl.text.trim(),
        extendedProfile: _buildExtendedProfile(),
        expertiseTags: _expertiseTags,
      );
      ref.invalidate(myMentorProfileProvider);
      if (!mounted) return;
      AppToast.success(context, 'mentorship.signup_success'.tr());
      Navigator.of(context).pop();
    } catch (e) {
      if (!mounted) return;
      AppToast.fromError(context, e, fallback: 'mentorship.signup_failed'.tr());
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  Future<void> _saveDraft() async {
    setState(() => _savingDraft = true);
    try {
      final repo = ref.read(mentorshipRepositoryProvider);
      await repo.saveMentorProfileDraft(
        currentJobTitle: _jobCtl.text.trim(),
        currentCompany: _companyCtl.text.trim(),
        defaultMeetingLink: _meetingCtl.text.trim(),
        extendedProfile: _buildExtendedProfile(),
        expertiseTags: _expertiseTags,
      );
      ref.invalidate(myMentorProfileProvider);
      if (!mounted) return;
      AppToast.success(context, 'mentorship.signup_draft_saved'.tr());
    } catch (e) {
      if (!mounted) return;
      AppToast.fromError(
        context,
        e,
        fallback: 'mentorship.signup_draft_failed'.tr(),
      );
    } finally {
      if (mounted) setState(() => _savingDraft = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final verificationAsync = ref.watch(myVerificationLevelProvider);
    final existingProfileAsync = ref.watch(myMentorProfileProvider);
    final accountProfileAsync = ref.watch(myProfileProvider);
    final menteeProfileAsync = ref.watch(myMenteeProfileProvider);

    if (verificationAsync.isLoading || existingProfileAsync.isLoading) {
      return Scaffold(
        appBar: AppBar(title: Text('mentorship.become_mentor'.tr())),
        body: const Center(child: CircularProgressIndicator()),
      );
    }

    final verificationLevel = verificationAsync.valueOrNull ?? 0;
    if (verificationLevel < _kMinVerificationLevel) {
      final needsEmail = verificationLevel < 1;
      return _MentorSignupStatusScaffold(
        severityColor: AppColors.warning,
        icon: Icons.verified_user_outlined,
        title: 'mentorship.mentor_signup_not_eligible_title'.tr(),
        message:
            needsEmail
                ? 'mentorship.mentee_signup_not_eligible_email'.tr()
                : 'mentorship.mentee_signup_not_eligible_academic'.tr(),
        actionLabel: 'mentorship.verify_account'.tr(),
        onAction: () => context.push(RouteNames.organizationRegistration),
      );
    }

    final existingStatus =
        (existingProfileAsync.valueOrNull?.status ?? '').toUpperCase();
    if (existingStatus == 'PENDING' || existingStatus == 'APPROVED') {
      final isApproved = existingStatus == 'APPROVED';
      return _MentorSignupStatusScaffold(
        severityColor: isApproved ? AppColors.success : AppColors.info,
        icon:
            isApproved
                ? Icons.verified_user_outlined
                : Icons.hourglass_top_outlined,
        title:
            isApproved
                ? 'mentorship.mentor_signup_approved_title'.tr()
                : 'mentorship.mentor_signup_pending_title'.tr(),
        message:
            isApproved
                ? 'mentorship.mentor_signup_approved_desc'.tr()
                : 'mentorship.mentor_signup_pending_desc'.tr(),
      );
    }

    _hydrateFromExistingProfile(existingProfileAsync.valueOrNull);
    _hydrateFromAccount(
      profile: accountProfileAsync.valueOrNull,
      mentee: menteeProfileAsync.valueOrNull,
    );

    return Scaffold(
      appBar: AppBar(title: Text('mentorship.become_mentor'.tr())),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            _CvUploadCard(
              extracting: _cvExtracting,
              fileName: _cvFileName,
              error: _cvExtractError,
              onPick: _pickCv,
            ),
            const SizedBox(height: 24),
            _Label('mentorship.signup_mentor_info'.tr()),
            const SizedBox(height: 12),
            TextFormField(
              controller: _jobCtl,
              validator:
                  (v) =>
                      (v == null || v.trim().isEmpty)
                          ? 'mentorship.signup_job_required'.tr()
                          : null,
              decoration: InputDecoration(
                labelText: 'mentorship.signup_job_label'.tr(),
                hintText: 'VD: Senior Software Engineer',
                prefixIcon: const Icon(Icons.work_outline),
              ),
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _companyCtl,
              validator:
                  (v) =>
                      (v == null || v.trim().isEmpty)
                          ? 'mentorship.signup_company_required'.tr()
                          : null,
              decoration: InputDecoration(
                labelText: 'mentorship.signup_company_label'.tr(),
                hintText: 'VD: FPT Software',
                prefixIcon: const Icon(Icons.apartment_outlined),
              ),
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _meetingCtl,
              keyboardType: TextInputType.url,
              decoration: InputDecoration(
                labelText: 'mentorship.signup_meeting_link_label'.tr(),
                hintText: 'VD: https://meet.google.com/...',
                prefixIcon: const Icon(Icons.video_call_outlined),
              ),
            ),
            const SizedBox(height: 24),
            _Label('mentorship.signup_tab_content_title'.tr()),
            const SizedBox(height: 4),
            Text(
              'mentorship.signup_tab_content_desc'.tr(),
              style: const TextStyle(
                fontSize: 12,
                color: AppColors.textSecondary,
              ),
            ),
            const SizedBox(height: 8),
            TextFormField(
              controller: _summaryCtl,
              maxLines: 4,
              validator:
                  (v) =>
                      (v == null || v.trim().isEmpty)
                          ? 'mentorship.signup_tab_content_required'.tr()
                          : null,
              decoration: InputDecoration(
                hintText: 'mentorship.signup_tab_content_placeholder'.tr(),
                alignLabelWithHint: true,
              ),
            ),
            const SizedBox(height: 8),
            Align(
              alignment: Alignment.centerRight,
              child: ElevatedButton.icon(
                onPressed: _tagsExtracting ? null : _extractTags,
                icon:
                    _tagsExtracting
                        ? const SizedBox(
                          height: 16,
                          width: 16,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                        : const Icon(Icons.auto_awesome, size: 18),
                label: Text(
                  _tagsExtracting
                      ? 'mentorship.signup_tab_extract_analyzing'.tr()
                      : 'mentorship.signup_tab_extract_btn'.tr(),
                ),
              ),
            ),
            if (_tagsExtractError != null) ...[
              const SizedBox(height: 8),
              Text(
                _tagsExtractError!,
                style: const TextStyle(fontSize: 12, color: AppColors.error),
              ),
            ],
            if (_tagsExtractAttempted || _expertiseTags.isNotEmpty) ...[
              const SizedBox(height: 12),
              Text(
                'mentorship.signup_tab_tags_hint'.tr(),
                style: const TextStyle(
                  fontSize: 12,
                  color: AppColors.textSecondary,
                ),
              ),
              const SizedBox(height: 8),
              if (_expertiseTags.isEmpty)
                Text(
                  'mentorship.signup_tab_no_tags'.tr(),
                  style: const TextStyle(
                    fontSize: 13,
                    color: AppColors.textSecondary,
                  ),
                )
              else ...[
                Text(
                  'mentorship.signup_tab_tags_priority_hint'.tr(),
                  style: const TextStyle(
                    fontSize: 12,
                    color: AppColors.textSecondary,
                  ),
                ),
                const SizedBox(height: 6),
                ReorderableListView(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  onReorderItem: (oldIndex, newIndex) {
                    setState(() {
                      final tag = _expertiseTags.removeAt(oldIndex);
                      _expertiseTags.insert(newIndex, tag);
                    });
                  },
                  children: [
                    for (final (index, tag) in _expertiseTags.indexed)
                      Container(
                        key: ValueKey(tag),
                        margin: const EdgeInsets.only(bottom: 8),
                        padding: const EdgeInsets.symmetric(
                          horizontal: 12,
                          vertical: 4,
                        ),
                        decoration: BoxDecoration(
                          border: Border.all(color: AppColors.divider),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: Row(
                          children: [
                            IconButton(
                              icon: const Icon(Icons.close, size: 18),
                              onPressed: () => _removeTag(tag),
                              tooltip: 'mentorship.signup_tab_remove_tag'.tr(),
                            ),
                            Text(
                              '${index + 1}',
                              style: const TextStyle(
                                fontWeight: FontWeight.bold,
                                color: AppColors.textSecondary,
                              ),
                            ),
                            const SizedBox(width: 10),
                            Expanded(
                              child: Text(
                                tag,
                                style: const TextStyle(
                                  fontWeight: FontWeight.w600,
                                ),
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                            const Icon(
                              Icons.drag_handle,
                              color: AppColors.textSecondary,
                            ),
                          ],
                        ),
                      ),
                  ],
                ),
              ],
              const SizedBox(height: 8),
              Row(
                children: [
                  Expanded(
                    child: TextFormField(
                      controller: _manualTagCtl,
                      decoration: InputDecoration(
                        isDense: true,
                        hintText:
                            'mentorship.signup_tab_manual_tag_placeholder'.tr(),
                      ),
                      onFieldSubmitted: (_) => _handleManualAddTag(),
                    ),
                  ),
                  const SizedBox(width: 8),
                  TextButton.icon(
                    onPressed: _handleManualAddTag,
                    icon: const Icon(Icons.add, size: 18),
                    label: Text('mentorship.signup_tab_add_btn'.tr()),
                  ),
                ],
              ),
            ],
            const SizedBox(height: 24),
            _SectionList(
              title: 'mentorship.signup_education_title'.tr(),
              addLabel: 'mentorship.signup_add_education'.tr(),
              items: _educations,
              onChanged: () => setState(() {}),
              fields: const ['school', 'degree', 'period'],
              fieldLabels: [
                'mentorship.signup_edu_school'.tr(),
                'mentorship.signup_edu_degree'.tr(),
                'mentorship.signup_edu_period'.tr(),
              ],
            ),
            const SizedBox(height: 20),
            _SectionList(
              title: 'mentorship.signup_experience_title'.tr(),
              addLabel: 'mentorship.signup_add_experience'.tr(),
              items: _experiences,
              onChanged: () => setState(() {}),
              fields: const ['title', 'company', 'period', 'description'],
              fieldLabels: [
                'mentorship.signup_exp_title'.tr(),
                'mentorship.signup_exp_company'.tr(),
                'mentorship.signup_exp_period'.tr(),
                'mentorship.signup_exp_description'.tr(),
              ],
              multilineFields: const ['description'],
            ),
            const SizedBox(height: 20),
            _SectionList(
              title: 'mentorship.signup_projects_title'.tr(),
              addLabel: 'mentorship.signup_add_project'.tr(),
              items: _projects,
              onChanged: () => setState(() {}),
              fields: const ['name', 'description', 'link'],
              fieldLabels: [
                'mentorship.signup_project_name'.tr(),
                'mentorship.signup_project_desc'.tr(),
                'mentorship.signup_project_link'.tr(),
              ],
              multilineFields: const ['description'],
            ),
            const SizedBox(height: 20),
            _SectionList(
              title: 'mentorship.signup_awards_title'.tr(),
              addLabel: 'mentorship.signup_add_award'.tr(),
              items: _awards,
              onChanged: () => setState(() {}),
              fields: const ['name', 'year', 'description'],
              fieldLabels: [
                'mentorship.signup_award_name'.tr(),
                'mentorship.signup_award_year'.tr(),
                'mentorship.signup_award_desc'.tr(),
              ],
            ),
            const SizedBox(height: 20),
            _SectionList(
              title: 'mentorship.signup_skills_title'.tr(),
              addLabel: 'mentorship.signup_add_skill'.tr(),
              items: _skills,
              onChanged: () => setState(() {}),
              fields: const ['name', 'issuer'],
              fieldLabels: [
                'mentorship.signup_skill_name'.tr(),
                'mentorship.signup_skill_issuer'.tr(),
              ],
            ),
            const SizedBox(height: 16),
            CheckboxListTile(
              value: _termsAccepted,
              onChanged: (v) => setState(() => _termsAccepted = v ?? false),
              controlAffinity: ListTileControlAffinity.leading,
              contentPadding: EdgeInsets.zero,
              title: Text(
                'mentorship.signup_terms_label'.tr(),
                style: const TextStyle(fontSize: 14),
              ),
            ),
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: OutlinedButton.icon(
                onPressed: (_submitting || _savingDraft) ? null : _saveDraft,
                icon:
                    _savingDraft
                        ? const SizedBox(
                          height: 18,
                          width: 18,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                        : const Icon(Icons.save_outlined),
                label: Text(
                  _savingDraft
                      ? 'mentorship.signup_saving'.tr()
                      : 'mentorship.signup_save_draft'.tr(),
                ),
              ),
            ),
            const SizedBox(height: 10),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: (_submitting || _savingDraft) ? null : _submit,
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 14),
                ),
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
                          'mentorship.signup_submit'.tr(),
                          style: const TextStyle(fontSize: 16),
                        ),
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'mentorship.signup_pending_notice'.tr(),
              textAlign: TextAlign.center,
              style: const TextStyle(
                color: AppColors.textSecondary,
                fontSize: 12.5,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _MentorSignupStatusScaffold extends StatelessWidget {
  const _MentorSignupStatusScaffold({
    required this.severityColor,
    required this.icon,
    required this.title,
    required this.message,
    this.actionLabel,
    this.onAction,
  });

  final Color severityColor;
  final IconData icon;
  final String title;
  final String message;
  final String? actionLabel;
  final VoidCallback? onAction;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('mentorship.become_mentor'.tr())),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          TextButton.icon(
            onPressed: () => Navigator.of(context).pop(),
            icon: const Icon(Icons.arrow_back),
            label: Text('mentorship.mentee_signup_go_back'.tr()),
          ),
          const SizedBox(height: 8),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: severityColor.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: severityColor.withValues(alpha: 0.35)),
            ),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Icon(icon, color: severityColor),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        title,
                        style: TextStyle(
                          color: severityColor,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        message,
                        style: const TextStyle(color: AppColors.textSecondary),
                      ),
                      if (actionLabel != null && onAction != null) ...[
                        const SizedBox(height: 12),
                        FilledButton(
                          onPressed: onAction,
                          child: Text(actionLabel!),
                        ),
                      ],
                    ],
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

/// Card offering to auto-fill the form below from an uploaded CV (PDF).
/// Mirrors the web signup form's "Quick-fill from CV" card.
class _CvUploadCard extends StatelessWidget {
  const _CvUploadCard({
    required this.extracting,
    required this.fileName,
    required this.error,
    required this.onPick,
  });

  final bool extracting;
  final String? fileName;
  final String? error;
  final VoidCallback onPick;

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 0,
      color: AppColors.primaryLighter,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(10),
        side: const BorderSide(color: AppColors.primary, width: 0.5),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'mentorship.signup_cv_title'.tr(),
                        style: const TextStyle(
                          fontWeight: FontWeight.w700,
                          color: AppColors.primary,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        'mentorship.signup_cv_desc'.tr(),
                        style: const TextStyle(
                          fontSize: 12,
                          color: AppColors.textSecondary,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 12),
                ElevatedButton.icon(
                  onPressed: extracting ? null : onPick,
                  icon:
                      extracting
                          ? const SizedBox(
                            height: 16,
                            width: 16,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          )
                          : const Icon(Icons.upload_file_outlined, size: 18),
                  label: Text(
                    extracting
                        ? 'mentorship.signup_cv_extracting'.tr()
                        : 'mentorship.signup_cv_upload_btn'.tr(),
                  ),
                ),
              ],
            ),
            if (fileName != null && error == null) ...[
              const SizedBox(height: 8),
              Text(
                'mentorship.signup_cv_selected'.tr(
                  namedArgs: {'name': fileName!},
                ),
                style: const TextStyle(fontSize: 12),
              ),
            ],
            if (error != null) ...[
              const SizedBox(height: 8),
              Text(
                error!,
                style: const TextStyle(fontSize: 12, color: AppColors.error),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

/// Repeatable list of free-form entries (education/experience/projects/
/// awards/skills) — native counterpart of the web `SectionList` component.
class _SectionList extends StatelessWidget {
  const _SectionList({
    required this.title,
    required this.addLabel,
    required this.items,
    required this.onChanged,
    required this.fields,
    required this.fieldLabels,
    this.multilineFields = const [],
  });

  final String title;
  final String addLabel;
  final List<_EntryDraft> items;
  final VoidCallback onChanged;
  final List<String> fields;
  final List<String> fieldLabels;
  final List<String> multilineFields;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Expanded(child: _Label(title)),
            TextButton.icon(
              onPressed: () {
                items.add(_EntryDraft({for (final f in fields) f: ''}));
                onChanged();
              },
              icon: const Icon(Icons.add, size: 18),
              label: Text(addLabel),
            ),
          ],
        ),
        const SizedBox(height: 8),
        if (items.isEmpty)
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              border: Border.all(color: AppColors.divider),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Text(
              'mentorship.signup_no_items'.tr(namedArgs: {'label': addLabel}),
              textAlign: TextAlign.center,
              style: const TextStyle(
                color: AppColors.textSecondary,
                fontSize: 13,
              ),
            ),
          )
        else
          ...items.asMap().entries.map(
            (entry) => Card(
              key: ValueKey(entry.value),
              margin: const EdgeInsets.only(bottom: 12),
              elevation: 0,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(10),
                side: const BorderSide(color: AppColors.divider),
              ),
              child: Padding(
                padding: const EdgeInsets.all(12),
                child: Column(
                  children: [
                    for (var i = 0; i < fields.length; i++) ...[
                      TextFormField(
                        initialValue: entry.value.values[fields[i]],
                        maxLines: multilineFields.contains(fields[i]) ? 3 : 1,
                        onChanged: (v) => entry.value.values[fields[i]] = v,
                        decoration: InputDecoration(
                          labelText: fieldLabels[i],
                          isDense: true,
                        ),
                      ),
                      if (i != fields.length - 1) const SizedBox(height: 8),
                    ],
                    Align(
                      alignment: Alignment.centerRight,
                      child: IconButton(
                        icon: const Icon(
                          Icons.delete_outline,
                          color: AppColors.error,
                        ),
                        onPressed: () {
                          items.removeAt(entry.key);
                          onChanged();
                        },
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
      ],
    );
  }
}

class _Label extends StatelessWidget {
  const _Label(this.text);
  final String text;

  @override
  Widget build(BuildContext context) {
    return Text(
      text,
      style: const TextStyle(
        fontWeight: FontWeight.w700,
        fontSize: 15,
        color: AppColors.primary,
      ),
    );
  }
}
