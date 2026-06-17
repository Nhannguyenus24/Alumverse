import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/theme/app_colors.dart';
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
      appBar: AppBar(title: const Text('Chỉnh sửa hồ sơ')),
      body: async.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (_, __) => ErrorView(
          message: 'Không tải được hồ sơ',
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

  static const _genders = {'male': 'Nam', 'female': 'Nữ', 'other': 'Khác'};

  @override
  void initState() {
    super.initState();
    _bioCtl = TextEditingController(text: widget.profile.bio ?? '');
    _phoneCtl = TextEditingController(text: widget.profile.phone ?? '');
    _dobCtl = TextEditingController(text: widget.profile.dob ?? '');
    final g = widget.profile.gender?.toLowerCase();
    _gender = _genders.containsKey(g) ? g : null;
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
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Thiếu thông tin tổ chức.')),
      );
      return;
    }
    setState(() => _submitting = true);
    try {
      await ref.read(userRepositoryProvider).updateProfile(
            organizationId: orgId,
            bio: _bioCtl.text.trim(),
            phone: _phoneCtl.text.trim(),
            gender: _gender,
          );
      ref.invalidate(myProfileProvider);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Cập nhật hồ sơ thành công.')),
      );
      context.pop();
    } catch (e) {
      if (!mounted) return;
      final message = e is Exception
          ? e.toString().replaceFirst('Exception: ', '')
          : 'Cập nhật thất bại';
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(message)),
      );
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
        _ReadOnlyField(label: 'Họ và tên', value: p.fullName ?? '—'),
        const SizedBox(height: 12),
        _ReadOnlyField(label: 'Email', value: p.email),
        const SizedBox(height: 12),
        if (p.studentId != null && p.studentId!.isNotEmpty) ...[
          _ReadOnlyField(label: 'Mã số sinh viên', value: p.studentId!),
          const SizedBox(height: 12),
        ],
        TextField(
          controller: _bioCtl,
          maxLines: 4,
          decoration: const InputDecoration(
            labelText: 'Giới thiệu',
            alignLabelWithHint: true,
            prefixIcon: Icon(Icons.notes_outlined),
          ),
        ),
        const SizedBox(height: 16),
        TextField(
          controller: _phoneCtl,
          keyboardType: TextInputType.phone,
          decoration: const InputDecoration(
            labelText: 'Số điện thoại',
            prefixIcon: Icon(Icons.phone_outlined),
          ),
        ),
        const SizedBox(height: 16),
        DropdownButtonFormField<String>(
          value: _gender,
          items: _genders.entries
              .map((e) =>
                  DropdownMenuItem(value: e.key, child: Text(e.value)))
              .toList(),
          onChanged: (v) => setState(() => _gender = v),
          decoration: const InputDecoration(
            labelText: 'Giới tính',
            prefixIcon: Icon(Icons.wc_outlined),
          ),
        ),
        const SizedBox(height: 16),
        TextField(
          controller: _dobCtl,
          readOnly: true,
          decoration: const InputDecoration(
            labelText: 'Ngày sinh',
            hintText: 'YYYY-MM-DD',
            prefixIcon: Icon(Icons.cake_outlined),
            suffixIcon: Icon(Icons.calendar_today_outlined),
          ),
          onTap: _pickDob,
        ),
        const SizedBox(height: 28),
        ElevatedButton(
          onPressed: _submitting ? null : _save,
          style: ElevatedButton.styleFrom(
            padding: const EdgeInsets.symmetric(vertical: 16),
          ),
          child: _submitting
              ? const SizedBox(
                  height: 20,
                  width: 20,
                  child: CircularProgressIndicator(
                      strokeWidth: 2, color: Colors.white),
                )
              : const Text('Lưu thay đổi', style: TextStyle(fontSize: 16)),
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
