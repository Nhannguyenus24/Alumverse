import 'dart:convert';

import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';

import '../../../../core/router/route_names.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/utils/image_url.dart';
import '../../../../shared/widgets/app_toast.dart';
import '../../../auth/presentation/providers/auth_provider.dart';
import '../../data/models/trusted_verifier.dart';
import '../../data/repositories/organization_repository.dart';
import '../providers/organization_provider.dart';

/// Join an organization with academic info — native port of the web
/// `OrganizationRegistrationPage.jsx`. Picking a trusted verifier makes every
/// field optional; attaching a proof file makes the academic fields optional.
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
  final _programCtl = TextEditingController(); // free text fallback
  final _majorCtl = TextEditingController();

  // Multiple trusted verifiers can be selected; the request is sent to each.
  final Set<int> _selectedVerifierIds = {};
  XFile? _proofFile;
  bool _submitting = false;

  bool get _hasVerifier => _selectedVerifierIds.isNotEmpty;
  bool get _isAllOptional => _hasVerifier;
  bool get _isAcademicOptional => _proofFile != null || _hasVerifier;

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

  Future<void> _pickProof() async {
    final picker = ImagePicker();
    final file = await picker.pickImage(source: ImageSource.gallery);
    if (file == null) return;
    final length = await file.length();
    if (length > 5 * 1024 * 1024) {
      if (!mounted) return;
      AppToast.error(context, 'File minh chứng vượt quá 5MB.');
      return;
    }
    setState(() => _proofFile = file);
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
    // When a verifier is chosen the academic fields are optional, so skip
    // validation; otherwise require the form to pass.
    if (!_isAllOptional && !_formKey.currentState!.validate()) {
      return;
    }

    final org = ref.read(organizationStateProvider).valueOrNull;
    final orgId = org?.id;
    final programOptions = org?.programs ?? const <String>[];
    final majorOptions = org?.majors ?? const <String>[];

    // The program/major DropdownMenus aren't form fields, so enforce their
    // "required" rule here when the academic info isn't optional.
    if (!_isAcademicOptional) {
      if (programOptions.isNotEmpty && _selectedProgram == null) {
        AppToast.info(context, 'Vui lòng chọn hệ đào tạo.');
        return;
      }
      if (majorOptions.isNotEmpty && _selectedMajor == null) {
        AppToast.info(context, 'Vui lòng chọn chuyên ngành.');
        return;
      }
    }
    final userId = ref.read(authStateProvider).valueOrNull?.user?.id;
    if (orgId == null || userId == null) {
      AppToast.error(context, 'Thiếu thông tin tổ chức hoặc tài khoản.');
      return;
    }
    final parsedUserId = int.tryParse(userId);
    if (parsedUserId == null) return;

    setState(() => _submitting = true);
    try {
      final program = _program(programOptions);
      final major = _major(majorOptions);
      final gradYear = int.tryParse(_graduatedYearCtl.text.trim());

      await ref.read(organizationRepositoryProvider).joinOrganization(
            organizationId: orgId,
            userId: parsedUserId,
            program: (program != null && program.isNotEmpty) ? [program] : null,
            major: (major != null && major.isNotEmpty) ? [major] : null,
            graduatedYear: gradYear != null ? [gradYear] : null,
          );

      // Optional: ask each chosen verifier to vouch (one request per verifier).
      if (_selectedVerifierIds.isNotEmpty) {
        final repo = ref.read(organizationRepositoryProvider);
        var failed = 0;
        for (final verifierId in _selectedVerifierIds) {
          try {
            await repo.requestPeerVerification(
              organizationId: orgId,
              verifierUserId: verifierId,
            );
          } catch (_) {
            failed++;
          }
        }
        if (mounted) {
          if (failed == 0) {
            AppToast.success(context, 'Đã gửi yêu cầu xác thực tới người bạn chọn.');
          } else {
            AppToast.error(context,
                'Một số yêu cầu xác thực gửi không thành công ($failed).');
          }
        }
      }

      // Optional: upload proof document.
      if (_proofFile != null) {
        try {
          final bytes = await _proofFile!.readAsBytes();
          await ref.read(organizationRepositoryProvider).createVerificationRequest(
                base64File: base64Encode(bytes),
                originalFileName: _proofFile!.name,
                documentType: 'image',
              );
          if (mounted) {
            AppToast.success(context, 'Yêu cầu xác thực minh chứng đã được gửi.');
          }
        } catch (_) {
          if (mounted) {
            AppToast.error(context, 'Gửi yêu cầu xác thực minh chứng thất bại.');
          }
        }
      }

      if (!mounted) return;
      AppToast.success(context, 'Đăng ký tham gia tổ chức thành công.');
      context.go(RouteNames.home);
    } catch (e) {
      if (!mounted) return;
      final message = e is Exception
          ? e.toString().replaceFirst('Exception: ', '')
          : 'Đăng ký tổ chức thất bại';
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
        title: const Text('Xác minh học vấn'),
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
                  'XÁC MINH HỌC VẤN',
                  style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                        fontWeight: FontWeight.bold,
                        color: AppColors.primary,
                      ),
                ),
                const SizedBox(height: 8),
                const Text(
                  'Vui lòng cung cấp thông tin học thuật của bạn để xác minh '
                  'học vấn và tham gia tổ chức.',
                  style: TextStyle(color: AppColors.textSecondary),
                ),
                const SizedBox(height: 16),

                if (_isAllOptional)
                  _InfoBanner(
                    'Bạn đã chọn người xác thực, không cần điền các thông tin '
                    'bên dưới.',
                  ),

                // --- Student info ---
                _SectionLabel(
                  'Thông tin sinh viên',
                  required: !_isAllOptional,
                ),
                TextFormField(
                  controller: _studentCodeCtl,
                  validator: _isAllOptional
                      ? null
                      : (v) => (v == null || v.trim().isEmpty)
                          ? 'Mã số sinh viên là bắt buộc'
                          : null,
                  decoration: const InputDecoration(
                    labelText: 'Mã số sinh viên',
                    hintText: 'Ví dụ: 1234567',
                    prefixIcon: Icon(Icons.badge_outlined),
                  ),
                ),
                const SizedBox(height: 16),

                // --- Academic info ---
                _SectionLabel(
                  'Thông tin học thuật',
                  required: !_isAcademicOptional,
                ),
                if (programOptions.isNotEmpty)
                  // Material 3 dropdown: opens BELOW the field, sized to it,
                  // rounded, capped to ~5 rows (matches the register page).
                  DropdownMenu<String>(
                    initialSelection: _selectedProgram,
                    expandedInsets: EdgeInsets.zero,
                    requestFocusOnTap: false,
                    hintText: 'Hệ đào tạo',
                    leadingIcon: const Icon(Icons.school_outlined),
                    menuHeight: 240,
                    textStyle: const TextStyle(fontSize: 16),
                    menuStyle: MenuStyle(
                      shape: WidgetStatePropertyAll(
                        RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      backgroundColor:
                          const WidgetStatePropertyAll(Colors.white),
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
                    validator: _isAcademicOptional
                        ? null
                        : (v) => (v == null || v.trim().isEmpty)
                            ? 'Hệ đào tạo là bắt buộc'
                            : null,
                    decoration: const InputDecoration(
                      labelText: 'Hệ đào tạo',
                      hintText: 'Ví dụ: K15',
                      prefixIcon: Icon(Icons.school_outlined),
                    ),
                  ),
                const SizedBox(height: 16),
                Row(
                  children: [
                    Expanded(
                      child: TextFormField(
                        controller: _startYearCtl,
                        keyboardType: TextInputType.number,
                        validator: _isAcademicOptional
                            ? null
                            : (v) => (v == null || v.trim().isEmpty)
                                ? 'Bắt buộc'
                                : null,
                        decoration: const InputDecoration(
                          labelText: 'Năm bắt đầu',
                          hintText: '2015',
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: TextFormField(
                        controller: _graduatedYearCtl,
                        keyboardType: TextInputType.number,
                        validator: _isAcademicOptional
                            ? null
                            : (v) => (v == null || v.trim().isEmpty)
                                ? 'Bắt buộc'
                                : null,
                        decoration: const InputDecoration(
                          labelText: 'Năm tốt nghiệp',
                          hintText: '2019',
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                if (majorOptions.isNotEmpty)
                  DropdownMenu<String>(
                    initialSelection: _selectedMajor,
                    expandedInsets: EdgeInsets.zero,
                    requestFocusOnTap: false,
                    hintText: 'Chuyên ngành',
                    leadingIcon: const Icon(Icons.book_outlined),
                    menuHeight: 240,
                    textStyle: const TextStyle(fontSize: 16),
                    menuStyle: MenuStyle(
                      shape: WidgetStatePropertyAll(
                        RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      backgroundColor:
                          const WidgetStatePropertyAll(Colors.white),
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
                    validator: _isAcademicOptional
                        ? null
                        : (v) => (v == null || v.trim().isEmpty)
                            ? 'Chuyên ngành là bắt buộc'
                            : null,
                    decoration: const InputDecoration(
                      labelText: 'Chuyên ngành',
                      hintText: 'Ví dụ: Khoa học máy tính',
                      prefixIcon: Icon(Icons.book_outlined),
                    ),
                  ),
                const SizedBox(height: 24),

                // --- Proof upload (optional) ---
                const _SectionLabel('Minh chứng (Tùy chọn)', required: false),
                OutlinedButton.icon(
                  onPressed: _submitting ? null : _pickProof,
                  icon: const Icon(Icons.cloud_upload_outlined),
                  label: Text(
                    _proofFile != null
                        ? 'Đổi file minh chứng'
                        : 'Tải lên minh chứng',
                  ),
                  style: OutlinedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 14),
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.only(top: 6),
                  child: Text(
                    _proofFile != null
                        ? 'Đã chọn: ${_proofFile!.name}'
                        : 'Hỗ trợ ảnh JPG/PNG, tối đa 5MB.',
                    style: const TextStyle(
                      fontSize: 12,
                      color: AppColors.textSecondary,
                    ),
                  ),
                ),
                const SizedBox(height: 24),

                // --- Trusted verifiers ---
                const _SectionLabel('Người xác thực tin cậy', required: false),
                const Text(
                  'Chọn một hoặc nhiều người bạn quen biết trong tổ chức để xác '
                  'thực danh tính, giúp yêu cầu được phê duyệt nhanh hơn.',
                  style: TextStyle(
                      fontSize: 13, color: AppColors.textSecondary),
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
                        onPressed: _submitting
                            ? null
                            : () => context.go(RouteNames.login),
                        style: OutlinedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(vertical: 16),
                        ),
                        child: const Text('Hủy bỏ'),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: ElevatedButton(
                        onPressed: _submitting ? null : () => _submit(),
                        style: ElevatedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(vertical: 16),
                        ),
                        child: _submitting
                            ? const SizedBox(
                                height: 20,
                                width: 20,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                  color: Colors.white,
                                ),
                              )
                            : const Text('Xác minh học vấn'),
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
  const _SectionLabel(this.text, {required this.required});

  final String text;
  final bool required;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Text(
        '$text ${required ? "(Bắt buộc)" : "(Tùy chọn)"}',
        style: TextStyle(
          fontWeight: FontWeight.w600,
          color: required ? AppColors.primary : AppColors.textSecondary,
        ),
      ),
    );
  }
}

class _InfoBanner extends StatelessWidget {
  const _InfoBanner(this.text);

  final String text;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppColors.info.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: AppColors.info.withValues(alpha: 0.3)),
      ),
      child: Row(
        children: [
          const Icon(Icons.info_outline, size: 20, color: AppColors.info),
          const SizedBox(width: 8),
          Expanded(
            child: Text(text, style: const TextStyle(fontSize: 13)),
          ),
        ],
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
      loading: () => const Padding(
        padding: EdgeInsets.symmetric(vertical: 24),
        child: Center(child: CircularProgressIndicator()),
      ),
      error: (_, __) => const Text(
        'Không tải được danh sách người xác thực.',
        style: TextStyle(color: AppColors.textSecondary),
      ),
      data: (verifiers) {
        if (verifiers.isEmpty) {
          return const Padding(
            padding: EdgeInsets.symmetric(vertical: 12),
            child: Text(
              'Hiện chưa có người xác thực khả dụng cho tổ chức này.',
              style: TextStyle(fontSize: 12, color: AppColors.textSecondary),
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
            color: selected
                ? AppColors.primary.withValues(alpha: 0.06)
                : Colors.transparent,
          ),
          child: Row(
            children: [
              CircleAvatar(
                radius: 20,
                backgroundColor: AppColors.primary.withValues(alpha: 0.1),
                backgroundImage: avatarUrl != null
                    ? CachedNetworkImageProvider(avatarUrl!)
                    : null,
                child: avatarUrl == null
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
