import 'dart:convert';

import 'package:cached_network_image/cached_network_image.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart'
    show FilteringTextInputFormatter, LengthLimitingTextInputFormatter;
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/utils/image_url.dart';
import '../../../../core/utils/validators.dart';
import '../../../../shared/widgets/app_toast.dart';
import '../../../../shared/widgets/blur_validated_field.dart';
import '../../../../shared/widgets/error_view.dart';
import '../../../organization/presentation/providers/organization_provider.dart';
import '../../data/models/user_profile.dart';
import '../../data/repositories/user_repository.dart';
import '../providers/user_providers.dart';

/// Edit profile — native port of the web `MyProfileEditPage` (core fields).
/// Name/email/student id are read-only; bio/phone/gender/dob are editable.
class MyProfileEditPage extends ConsumerWidget {
  const MyProfileEditPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(myProfileProvider);

    return Scaffold(
      appBar: AppBar(title: Text('profile.edit_profile'.tr())),
      body: async.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error:
            (_, __) => ErrorView(
              message: 'profile.load_failed'.tr(),
              onRetry: () => ref.invalidate(myProfileProvider),
            ),
        data: (p) => _EditForm(profile: p),
      ),
    );
  }
}

class _EditForm extends ConsumerStatefulWidget {
  const _EditForm({required this.profile});

  final UserProfile profile;

  @override
  ConsumerState<_EditForm> createState() => _EditFormState();
}

class _EditFormState extends ConsumerState<_EditForm> {
  late final TextEditingController _bioCtl;
  late final TextEditingController _phoneCtl;
  late final TextEditingController _dobCtl;
  String? _gender;
  bool _submitting = false;

  // Avatar: shows the saved URL until the user picks + uploads a new one.
  String? _avatarUrl;
  bool _uploadingAvatar = false;

  static const _genderKeys = ['male', 'female', 'other'];

  Map<String, String> get _genders => {
    'male': 'profile.gender_male'.tr(),
    'female': 'profile.gender_female'.tr(),
    'other': 'profile.gender_other'.tr(),
  };

  @override
  void initState() {
    super.initState();
    _bioCtl = TextEditingController(text: widget.profile.bio ?? '');
    _phoneCtl = TextEditingController(text: widget.profile.phone ?? '');
    _dobCtl = TextEditingController(text: widget.profile.dob ?? '');
    final g = widget.profile.gender?.toLowerCase();
    _gender = _genderKeys.contains(g) ? g : null;
    _avatarUrl = widget.profile.avatarUrl;
  }

  /// Pick an image, upload it, set it as the avatar, then refresh profile/auth
  /// so the new avatar shows everywhere immediately.
  Future<void> _changeAvatar() async {
    final picker = ImagePicker();
    final file = await picker.pickImage(
      source: ImageSource.gallery,
      maxWidth: 800,
      imageQuality: 85,
    );
    if (file == null) return;
    final length = await file.length();
    if (length > 5 * 1024 * 1024) {
      if (mounted) AppToast.error(context, 'profile.avatar_too_large'.tr());
      return;
    }

    setState(() => _uploadingAvatar = true);
    try {
      final bytes = await file.readAsBytes();
      final base64 = 'data:image/jpeg;base64,${base64Encode(bytes)}';
      final url = await ref
          .read(userRepositoryProvider)
          .updateAvatarFromBase64(base64);
      ref.invalidate(myProfileProvider);
      if (!mounted) return;
      setState(() => _avatarUrl = url);
      AppToast.success(context, 'profile.avatar_updated'.tr());
    } catch (e) {
      if (!mounted) return;
      AppToast.error(context, 'profile.avatar_update_failed'.tr());
    } finally {
      if (mounted) setState(() => _uploadingAvatar = false);
    }
  }

  @override
  void dispose() {
    _bioCtl.dispose();
    _phoneCtl.dispose();
    _dobCtl.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    final orgId = ref.read(organizationStateProvider).valueOrNull?.id;
    if (orgId == null) {
      AppToast.error(context, 'profile.org_missing'.tr());
      return;
    }
    final phoneError = Validators.vietnamPhone(_phoneCtl.text, optional: true);
    if (phoneError != null) {
      AppToast.error(context, phoneError);
      return;
    }
    setState(() => _submitting = true);
    try {
      await ref
          .read(userRepositoryProvider)
          .updateProfile(
            organizationId: orgId,
            bio: _bioCtl.text.trim(),
            phone: _phoneCtl.text.trim(),
            gender: _gender,
          );
      ref.invalidate(myProfileProvider);
      if (!mounted) return;
      AppToast.success(context, 'profile.update_success'.tr());
      context.pop();
    } catch (e) {
      if (!mounted) return;
      final message =
          e is Exception
              ? e.toString().replaceFirst('Exception: ', '')
              : 'profile.update_failed'.tr();
      AppToast.error(context, message);
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final p = widget.profile;
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Center(child: _avatarEditor()),
        const SizedBox(height: 20),
        _ReadOnlyField(
          label: 'profile.full_name'.tr(),
          value: p.fullName ?? '—',
        ),
        const SizedBox(height: 12),
        _ReadOnlyField(label: 'profile.email'.tr(), value: p.email),
        const SizedBox(height: 12),
        if (p.studentId != null && p.studentId!.isNotEmpty) ...[
          _ReadOnlyField(label: 'profile.student_id'.tr(), value: p.studentId!),
          const SizedBox(height: 12),
        ],
        TextField(
          controller: _bioCtl,
          maxLength: 500,
          decoration: InputDecoration(
            labelText: 'profile.bio'.tr(),
            prefixIcon: const Icon(Icons.notes_outlined),
          ),
        ),
        const SizedBox(height: 16),
        BlurValidatedField(
          controller: _phoneCtl,
          // Optional field, but if filled it must be a valid VN mobile number.
          validator: (v) => Validators.vietnamPhone(v, optional: true),
          keyboardType: TextInputType.phone,
          inputFormatters: [
            FilteringTextInputFormatter.digitsOnly,
            LengthLimitingTextInputFormatter(10),
          ],
          decoration: InputDecoration(
            labelText: 'profile.phone'.tr(),
            hintText: 'profile.phone_hint'.tr(),
            prefixIcon: const Icon(Icons.phone_outlined),
          ),
        ),
        const SizedBox(height: 16),
        // Material 3 dropdown: opens BELOW the field, sized to it, rounded.
        DropdownMenu<String>(
          initialSelection: _gender,
          expandedInsets: EdgeInsets.zero,
          requestFocusOnTap: false,
          hintText: 'profile.gender'.tr(),
          leadingIcon: const Icon(Icons.wc_outlined),
          textStyle: const TextStyle(fontSize: 16),
          menuStyle: MenuStyle(
            shape: WidgetStatePropertyAll(
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
            backgroundColor: const WidgetStatePropertyAll(Colors.white),
          ),
          inputDecorationTheme: const InputDecorationTheme(
            border: OutlineInputBorder(),
          ),
          dropdownMenuEntries: [
            for (final e in _genders.entries)
              DropdownMenuEntry(
                value: e.key,
                label: e.value,
                style: MenuItemButton.styleFrom(
                  textStyle: const TextStyle(fontSize: 16),
                ),
              ),
          ],
          onSelected: (v) => setState(() => _gender = v),
        ),
        const SizedBox(height: 16),
        TextField(
          controller: _dobCtl,
          readOnly: true,
          decoration: InputDecoration(
            labelText: 'profile.dob'.tr(),
            hintText: 'YYYY-MM-DD',
            prefixIcon: const Icon(Icons.cake_outlined),
            suffixIcon: const Icon(Icons.calendar_today_outlined),
          ),
          onTap: _pickDob,
        ),
        const SizedBox(height: 28),
        ElevatedButton(
          onPressed: _submitting ? null : _save,
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
                    'profile.save_changes'.tr(),
                    style: const TextStyle(fontSize: 16),
                  ),
        ),
      ],
    );
  }

  Widget _avatarEditor() {
    final url = resolveImageUrl(_avatarUrl);
    return Stack(
      children: [
        CircleAvatar(
          radius: 48,
          backgroundColor: AppColors.primary.withValues(alpha: 0.1),
          backgroundImage: url != null ? CachedNetworkImageProvider(url) : null,
          child:
              url == null
                  ? const Icon(Icons.person, size: 52, color: AppColors.primary)
                  : null,
        ),
        if (_uploadingAvatar)
          const Positioned.fill(
            child: CircleAvatar(
              radius: 48,
              backgroundColor: Colors.black45,
              child: SizedBox(
                width: 24,
                height: 24,
                child: CircularProgressIndicator(
                  strokeWidth: 2,
                  color: Colors.white,
                ),
              ),
            ),
          ),
        Positioned(
          right: 0,
          bottom: 0,
          child: Material(
            color: AppColors.primary,
            shape: const CircleBorder(),
            child: InkWell(
              customBorder: const CircleBorder(),
              onTap: _uploadingAvatar ? null : _changeAvatar,
              child: const Padding(
                padding: EdgeInsets.all(7),
                child: Icon(Icons.camera_alt, color: Colors.white, size: 18),
              ),
            ),
          ),
        ),
      ],
    );
  }

  Future<void> _pickDob() async {
    final now = DateTime.now();
    final initial = DateTime.tryParse(_dobCtl.text) ?? DateTime(now.year - 20);
    final picked = await showDatePicker(
      context: context,
      initialDate: initial,
      firstDate: DateTime(1950),
      lastDate: now,
    );
    if (picked != null) {
      _dobCtl.text =
          '${picked.year.toString().padLeft(4, '0')}-${picked.month.toString().padLeft(2, '0')}-${picked.day.toString().padLeft(2, '0')}';
    }
  }
}

class _ReadOnlyField extends StatelessWidget {
  const _ReadOnlyField({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return InputDecorator(
      decoration: InputDecoration(
        labelText: label,
        filled: true,
        fillColor: AppColors.background,
      ),
      child: Text(value),
    );
  }
}
