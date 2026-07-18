import 'dart:convert';
import 'dart:io';

import 'package:cached_network_image/cached_network_image.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/router/route_names.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/utils/image_url.dart';
import '../../../../shared/widgets/app_toast.dart';
import '../../../auth/presentation/providers/auth_provider.dart';
import '../../../user/presentation/providers/user_providers.dart';
import '../../data/models/trusted_verifier.dart';
import '../../data/repositories/organization_repository.dart';
import '../providers/organization_provider.dart';

const _graduationStatusOptions = <MapEntry<String, String>>[
  MapEntry('STUDYING', 'organization.graduation_status_studying'),
  MapEntry('GRADUATED', 'organization.graduation_status_graduated'),
  MapEntry('DROPPED', 'organization.graduation_status_dropped'),
];

/// Join an organization with academic info — native port of the web
/// `OrganizationRegistrationPage.jsx`. Academic fields are required; the user
/// must choose at least one verification method (proof and/or verifier).
class OrganizationRegistrationPage extends ConsumerStatefulWidget {
  const OrganizationRegistrationPage({super.key});

  @override
  ConsumerState<OrganizationRegistrationPage> createState() =>
      _OrganizationRegistrationPageState();
}

class _OrganizationRegistrationPageState
    extends ConsumerState<OrganizationRegistrationPage> {
  final _formKey = GlobalKey<FormState>();
  final _studentCodeCtl = TextEditingController();
  final _startYearCtl = TextEditingController();
  final _graduatedYearCtl = TextEditingController();

  String? _selectedProgram; // when org provides program options
  String? _selectedMajor; // when org provides major options
  String? _selectedGraduationStatus;
  final _programCtl = TextEditingController(); // free text fallback
  final _majorCtl = TextEditingController();

  // Multiple trusted verifiers can be selected; the request is sent to each.
  final Set<int> _selectedVerifierIds = {};
  PlatformFile? _proofFile;
  bool _submitting = false;

  @override
  void initState() {
    super.initState();
    // Auto-fill student code from the user's profile (set during registration).
    // Runs after the first frame so the widget tree and ref are fully ready.
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      final profile = ref.read(myProfileProvider).valueOrNull;
      if (profile?.studentId != null && _studentCodeCtl.text.isEmpty) {
        _studentCodeCtl.text = profile!.studentId!;
      }
    });
  }

  @override
  void dispose() {
    _studentCodeCtl.dispose();
    _startYearCtl.dispose();
    _graduatedYearCtl.dispose();
    _programCtl.dispose();
    _majorCtl.dispose();
    super.dispose();
  }

  String? _program(List<String> options) =>
      options.isNotEmpty ? _selectedProgram : _programCtl.text.trim();

  String? _major(List<String> options) =>
      options.isNotEmpty ? _selectedMajor : _majorCtl.text.trim();

  bool get _isGraduated => _selectedGraduationStatus == 'GRADUATED';

  Future<void> _pickProof() async {
    final result = await FilePicker.platform.pickFiles(
      type: FileType.custom,
      allowedExtensions: ['pdf', 'jpg', 'jpeg', 'png'],
      withData: true,
    );
    final file = result?.files.firstOrNull;
    if (file == null) return;
    final length = file.size;
    if (length > 5 * 1024 * 1024) {
      if (!mounted) return;
      AppToast.error(context, 'organization.proof_too_large'.tr());
      return;
    }
    setState(() => _proofFile = file);
  }

  String? _requiredYearValidator(String? value) {
    final raw = value?.trim() ?? '';
    if (raw.isEmpty) return 'common.required_field'.tr();
    final year = int.tryParse(raw);
    if (year == null || year <= 0) return 'organization.year_invalid'.tr();
    return null;
  }

  String? _graduatedYearValidator(String? value) {
    if (!_isGraduated) return null;
    final raw = value?.trim() ?? '';
    if (raw.isEmpty) return 'organization.graduated_year_required'.tr();
    final gradYear = int.tryParse(raw);
    if (gradYear == null || gradYear <= 0) {
      return 'organization.year_invalid'.tr();
    }
    final startYear = int.tryParse(_startYearCtl.text.trim());
    if (startYear != null && gradYear < startYear + 3) {
      return 'organization.graduated_year_after_start'.tr();
    }
    if (gradYear > DateTime.now().year) {
      return 'organization.graduated_year_future'.tr();
    }
    return null;
  }

  String _proofDocumentType(PlatformFile file) {
    final ext = (file.extension ?? '').toLowerCase();
    return ext == 'pdf' ? 'pdf' : 'image';
  }

  Future<List<int>> _proofBytes(PlatformFile file) async {
    final bytes = file.bytes;
    if (bytes != null) return bytes;
    final path = file.path;
    if (path == null) return const <int>[];
    return File(path).readAsBytes();
  }

  /// Toggle a verifier in/out of the selection (multi-select).
  void _toggleVerifier(TrustedVerifier verifier) {
    setState(() {
      if (_selectedVerifierIds.contains(verifier.userId)) {
        _selectedVerifierIds.remove(verifier.userId);
      } else {
        _selectedVerifierIds.add(verifier.userId);
      }
    });
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    final org = ref.read(organizationStateProvider).valueOrNull;
    final orgId = org?.id;
    final programOptions = org?.programs ?? const <String>[];
    final majorOptions = org?.majors ?? const <String>[];

    // The program/major/status DropdownMenus aren't form fields, so enforce
    // the same required academic payload the web registration form sends.
    if (programOptions.isNotEmpty && _selectedProgram == null) {
      AppToast.info(context, 'organization.select_program_required'.tr());
      return;
    }
    if (majorOptions.isNotEmpty && _selectedMajor == null) {
      AppToast.info(context, 'organization.select_major_required'.tr());
      return;
    }
    if (_selectedGraduationStatus == null) {
      AppToast.info(
        context,
        'organization.select_graduation_status_required'.tr(),
      );
      return;
    }
    if (_proofFile == null && _selectedVerifierIds.isEmpty) {
      AppToast.info(context, 'organization.select_verification_method'.tr());
      return;
    }
    final userId = ref.read(authStateProvider).valueOrNull?.user?.id;
    if (orgId == null || userId == null) {
      AppToast.error(context, 'organization.missing_org_or_account'.tr());
      return;
    }

    setState(() => _submitting = true);
    try {
      var verificationSubmitted = false;
      final program = _program(programOptions);
      final major = _major(majorOptions);
      final gradYear =
          _isGraduated ? int.tryParse(_graduatedYearCtl.text.trim()) : null;
      final studentCode = _studentCodeCtl.text.trim();
      final startYear = _startYearCtl.text.trim();

      await ref
          .read(organizationRepositoryProvider)
          .joinOrganization(
            organizationId: orgId,
            studentId: studentCode.isNotEmpty ? studentCode : null,
            startedYear: startYear.isNotEmpty ? [startYear] : null,
            program: (program != null && program.isNotEmpty) ? [program] : null,
            major: (major != null && major.isNotEmpty) ? [major] : null,
            graduatedYear: gradYear != null ? [gradYear] : null,
            graduationStatus:
                _selectedGraduationStatus != null
                    ? [_selectedGraduationStatus!]
                    : null,
          );

      // Ask each chosen verifier to vouch (one request per verifier).
      if (_selectedVerifierIds.isNotEmpty) {
        final repo = ref.read(organizationRepositoryProvider);
        var failed = 0;
        for (final verifierId in _selectedVerifierIds) {
          try {
            await repo.requestPeerVerification(
              organizationId: orgId,
              verifierUserId: verifierId,
            );
            verificationSubmitted = true;
          } catch (_) {
            failed++;
          }
        }
        if (mounted) {
          if (failed == 0) {
            AppToast.success(context, 'organization.verification_sent'.tr());
          } else {
            AppToast.error(
              context,
              'organization.verification_send_partial'.tr(
                namedArgs: {'count': failed.toString()},
              ),
            );
          }
        }
      }

      // Upload proof document if the user chose that verification channel.
      if (_proofFile != null) {
        try {
          final bytes = await _proofBytes(_proofFile!);
          await ref
              .read(organizationRepositoryProvider)
              .createVerificationRequest(
                organizationId: orgId,
                base64File: base64Encode(bytes),
                originalFileName: _proofFile!.name,
                documentType: _proofDocumentType(_proofFile!),
              );
          if (mounted) {
            AppToast.success(context, 'organization.proof_sent'.tr());
          }
          verificationSubmitted = true;
        } catch (e) {
          if (mounted) {
            AppToast.fromError(
              context,
              e,
              fallback: 'organization.proof_send_failed'.tr(),
            );
          }
        }
      }

      if (!mounted) return;
      if (verificationSubmitted) {
        await ref.read(authStateProvider.notifier).markVerificationSubmitted();
        if (!mounted) return;
        ref.invalidate(myVerificationLevelProvider);
        ref.invalidate(canContributeProvider);
        ref.invalidate(isOrgManagerProvider);
        ref.invalidate(canEventCheckInProvider);
      }
      AppToast.success(context, 'organization.join_success'.tr());
      context.go(RouteNames.home);
    } catch (e) {
      if (!mounted) return;
      final message =
          e is Exception
              ? e.toString().replaceFirst('Exception: ', '')
              : 'organization.join_failed'.tr();
      AppToast.error(context, message);
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final org = ref.watch(organizationStateProvider).valueOrNull;
    final programOptions = org?.programs ?? const <String>[];
    final majorOptions = org?.majors ?? const <String>[];

    return Scaffold(
      appBar: AppBar(
        title: Text('organization.academic_verification'.tr()),
        backgroundColor: Colors.transparent,
        elevation: 0,
        foregroundColor: Theme.of(context).primaryColor,
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text(
                  'organization.academic_verification_upper'.tr(),
                  style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                    fontWeight: FontWeight.bold,
                    color: AppColors.primary,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  'organization.academic_verification_desc'.tr(),
                  style: const TextStyle(color: AppColors.textSecondary),
                ),
                const SizedBox(height: 16),

                // --- Student info ---
                _SectionLabel('organization.student_info'.tr()),
                TextFormField(
                  controller: _studentCodeCtl,
                  validator:
                      (v) =>
                          (v == null || v.trim().isEmpty)
                              ? 'organization.student_code_required'.tr()
                              : null,
                  decoration: InputDecoration(
                    labelText: 'organization.student_code'.tr(),
                    hintText: 'organization.student_code_hint'.tr(),
                    prefixIcon: const Icon(Icons.badge_outlined),
                  ),
                ),
                const SizedBox(height: 16),

                // --- Academic info ---
                _SectionLabel('organization.academic_info'.tr()),
                if (programOptions.isNotEmpty)
                  // Material 3 dropdown: opens BELOW the field, sized to it,
                  // rounded, capped to ~5 rows (matches the register page).
                  DropdownMenu<String>(
                    initialSelection: _selectedProgram,
                    expandedInsets: EdgeInsets.zero,
                    requestFocusOnTap: false,
                    hintText: 'organization.program'.tr(),
                    leadingIcon: const Icon(Icons.school_outlined),
                    menuHeight: 240,
                    textStyle: const TextStyle(fontSize: 16),
                    menuStyle: MenuStyle(
                      shape: WidgetStatePropertyAll(
                        RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      backgroundColor: const WidgetStatePropertyAll(
                        Colors.white,
                      ),
                    ),
                    inputDecorationTheme: const InputDecorationTheme(
                      border: OutlineInputBorder(),
                    ),
                    dropdownMenuEntries: [
                      for (final p in programOptions)
                        DropdownMenuEntry(
                          value: p,
                          label: p,
                          style: MenuItemButton.styleFrom(
                            textStyle: const TextStyle(fontSize: 16),
                          ),
                        ),
                    ],
                    onSelected: (v) => setState(() => _selectedProgram = v),
                  )
                else
                  TextFormField(
                    controller: _programCtl,
                    validator:
                        (v) =>
                            (v == null || v.trim().isEmpty)
                                ? 'organization.program_required'.tr()
                                : null,
                    decoration: InputDecoration(
                      labelText: 'organization.program'.tr(),
                      hintText: 'organization.program_hint'.tr(),
                      prefixIcon: const Icon(Icons.school_outlined),
                    ),
                  ),
                const SizedBox(height: 16),
                Row(
                  children: [
                    Expanded(
                      child: TextFormField(
                        controller: _startYearCtl,
                        keyboardType: TextInputType.number,
                        validator: _requiredYearValidator,
                        decoration: InputDecoration(
                          labelText: 'organization.start_year'.tr(),
                          hintText: '2015',
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: TextFormField(
                        controller: _graduatedYearCtl,
                        keyboardType: TextInputType.number,
                        enabled: _isGraduated,
                        validator: _graduatedYearValidator,
                        decoration: InputDecoration(
                          labelText: 'profile.graduation_year'.tr(),
                          hintText: '2019',
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                DropdownMenu<String>(
                  initialSelection: _selectedGraduationStatus,
                  expandedInsets: EdgeInsets.zero,
                  requestFocusOnTap: false,
                  hintText: 'organization.graduation_status'.tr(),
                  leadingIcon: const Icon(Icons.verified_outlined),
                  menuHeight: 220,
                  textStyle: const TextStyle(fontSize: 16),
                  menuStyle: MenuStyle(
                    shape: WidgetStatePropertyAll(
                      RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    backgroundColor: const WidgetStatePropertyAll(Colors.white),
                  ),
                  inputDecorationTheme: const InputDecorationTheme(
                    border: OutlineInputBorder(),
                  ),
                  dropdownMenuEntries: [
                    for (final option in _graduationStatusOptions)
                      DropdownMenuEntry(
                        value: option.key,
                        label: option.value.tr(),
                        style: MenuItemButton.styleFrom(
                          textStyle: const TextStyle(fontSize: 16),
                        ),
                      ),
                  ],
                  onSelected:
                      (v) => setState(() {
                        _selectedGraduationStatus = v;
                        if (v != 'GRADUATED') _graduatedYearCtl.clear();
                      }),
                ),
                const SizedBox(height: 16),
                if (majorOptions.isNotEmpty)
                  DropdownMenu<String>(
                    initialSelection: _selectedMajor,
                    expandedInsets: EdgeInsets.zero,
                    requestFocusOnTap: false,
                    hintText: 'profile.major'.tr(),
                    leadingIcon: const Icon(Icons.book_outlined),
                    menuHeight: 240,
                    textStyle: const TextStyle(fontSize: 16),
                    menuStyle: MenuStyle(
                      shape: WidgetStatePropertyAll(
                        RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      backgroundColor: const WidgetStatePropertyAll(
                        Colors.white,
                      ),
                    ),
                    inputDecorationTheme: const InputDecorationTheme(
                      border: OutlineInputBorder(),
                    ),
                    dropdownMenuEntries: [
                      for (final m in majorOptions)
                        DropdownMenuEntry(
                          value: m,
                          label: m,
                          style: MenuItemButton.styleFrom(
                            textStyle: const TextStyle(fontSize: 16),
                          ),
                        ),
                    ],
                    onSelected: (v) => setState(() => _selectedMajor = v),
                  )
                else
                  TextFormField(
                    controller: _majorCtl,
                    validator:
                        (v) =>
                            (v == null || v.trim().isEmpty)
                                ? 'organization.major_required'.tr()
                                : null,
                    decoration: InputDecoration(
                      labelText: 'profile.major'.tr(),
                      hintText: 'organization.major_hint'.tr(),
                      prefixIcon: const Icon(Icons.book_outlined),
                    ),
                  ),
                const SizedBox(height: 24),

                // --- Proof upload (optional) ---
                _SectionLabel(
                  'organization.proof_optional'.tr(),
                  required: false,
                ),
                OutlinedButton.icon(
                  onPressed: _submitting ? null : _pickProof,
                  icon: const Icon(Icons.cloud_upload_outlined),
                  label: Text(
                    _proofFile != null
                        ? 'organization.change_proof'.tr()
                        : 'organization.upload_proof'.tr(),
                  ),
                  style: OutlinedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 14),
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.only(top: 6),
                  child: Text(
                    _proofFile != null
                        ? 'organization.proof_selected'.tr(
                          namedArgs: {'name': _proofFile!.name},
                        )
                        : 'organization.proof_hint'.tr(),
                    style: const TextStyle(
                      fontSize: 12,
                      color: AppColors.textSecondary,
                    ),
                  ),
                ),
                const SizedBox(height: 24),

                // --- Trusted verifiers ---
                _SectionLabel(
                  'organization.trusted_verifiers'.tr(),
                  required: false,
                ),
                Text(
                  'organization.trusted_verifiers_desc'.tr(),
                  style: const TextStyle(
                    fontSize: 13,
                    color: AppColors.textSecondary,
                  ),
                ),
                const SizedBox(height: 12),
                if (org != null)
                  _VerifierList(
                    organizationId: org.id,
                    selectedUserIds: _selectedVerifierIds,
                    onToggleVerifier: _toggleVerifier,
                  ),
                const SizedBox(height: 28),

                // --- Actions ---
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton(
                        onPressed:
                            _submitting
                                ? null
                                : () => context.go(RouteNames.login),
                        style: OutlinedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(vertical: 16),
                        ),
                        child: Text('common.cancel'.tr()),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: ElevatedButton(
                        onPressed: _submitting ? null : () => _submit(),
                        style: ElevatedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(vertical: 16),
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
                                  'organization.academic_verification'.tr(),
                                ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _SectionLabel extends StatelessWidget {
  const _SectionLabel(this.text, {this.required = true});

  final String text;
  final bool required;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Text(
        '$text ${required ? "(${('common.required'.tr())})" : "(${('common.optional'.tr())})"}',
        style: TextStyle(
          fontWeight: FontWeight.w600,
          color: required ? AppColors.primary : AppColors.textSecondary,
        ),
      ),
    );
  }
}

class _VerifierList extends ConsumerWidget {
  const _VerifierList({
    required this.organizationId,
    required this.selectedUserIds,
    required this.onToggleVerifier,
  });

  final int organizationId;
  final Set<int> selectedUserIds;
  final void Function(TrustedVerifier) onToggleVerifier;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(trustedVerifiersProvider(organizationId));

    return async.when(
      loading:
          () => const Padding(
            padding: EdgeInsets.symmetric(vertical: 24),
            child: Center(child: CircularProgressIndicator()),
          ),
      error:
          (_, __) => Text(
            'organization.verifiers_load_failed'.tr(),
            style: const TextStyle(color: AppColors.textSecondary),
          ),
      data: (verifiers) {
        if (verifiers.isEmpty) {
          return Padding(
            padding: const EdgeInsets.symmetric(vertical: 12),
            child: Text(
              'organization.no_verifiers'.tr(),
              style: const TextStyle(
                fontSize: 12,
                color: AppColors.textSecondary,
              ),
            ),
          );
        }
        return Column(
          children: [
            for (final v in verifiers)
              _VerifierTile(
                title: v.displayName,
                subtitle: [...v.program, ...v.major].join(' · '),
                avatarUrl: resolveImageUrl(v.avatarUrl),
                selected: selectedUserIds.contains(v.userId),
                onTap: () => onToggleVerifier(v),
              ),
          ],
        );
      },
    );
  }
}

class _VerifierTile extends StatelessWidget {
  const _VerifierTile({
    required this.title,
    required this.subtitle,
    required this.selected,
    required this.onTap,
    this.avatarUrl,
  });

  final String title;
  final String subtitle;
  final bool selected;
  final VoidCallback onTap;
  final String? avatarUrl;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: selected ? AppColors.primary : AppColors.divider,
              width: 1.5,
            ),
            color:
                selected
                    ? AppColors.primary.withValues(alpha: 0.06)
                    : Colors.transparent,
          ),
          child: Row(
            children: [
              CircleAvatar(
                radius: 20,
                backgroundColor: AppColors.primaryLighter,
                backgroundImage:
                    avatarUrl != null
                        ? CachedNetworkImageProvider(avatarUrl!)
                        : null,
                child:
                    avatarUrl == null
                        ? const Icon(Icons.person, color: AppColors.primary)
                        : null,
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(fontWeight: FontWeight.w600),
                    ),
                    if (subtitle.isNotEmpty)
                      Text(
                        subtitle,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          fontSize: 12,
                          color: AppColors.textSecondary,
                        ),
                      ),
                  ],
                ),
              ),
              if (selected)
                const Icon(Icons.check_circle, color: AppColors.primary),
            ],
          ),
        ),
      ),
    );
  }
}
