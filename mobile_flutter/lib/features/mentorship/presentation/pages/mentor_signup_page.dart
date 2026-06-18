import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../shared/widgets/app_toast.dart';
import '../../data/repositories/mentorship_repository.dart';
import '../providers/mentorship_providers.dart';

const _categories = <(String, String)>[
  ('CAREER', 'Nghề nghiệp'),
  ('ACADEMIC', 'Học thuật'),
  ('SOFT_SKILLS', 'Kỹ năng mềm'),
  ('GENERAL', 'Tổng quát'),
];

/// Draft of one expertise row in the signup form.
class _ExpertiseDraft {
  String topic = '';
  String category = 'CAREER';
  int? years;
  String description = '';
}

/// Become a mentor — native take on the web `MentorshipSignupPage`. Collects
/// the core profile fields + at least one expertise, then POSTs the profile
/// and each expertise. Mentor profiles start as PENDING (admin approval).
class MentorSignupPage extends ConsumerStatefulWidget {
  const MentorSignupPage({super.key});

  @override
  ConsumerState<MentorSignupPage> createState() => _MentorSignupPageState();
}

class _MentorSignupPageState extends ConsumerState<MentorSignupPage> {
  final _formKey = GlobalKey<FormState>();
  final _jobCtl = TextEditingController();
  final _companyCtl = TextEditingController();
  final _bioCtl = TextEditingController();
  final _meetingCtl = TextEditingController();

  final List<_ExpertiseDraft> _expertises = [_ExpertiseDraft()];
  bool _termsAccepted = false;
  bool _submitting = false;

  @override
  void dispose() {
    _jobCtl.dispose();
    _companyCtl.dispose();
    _bioCtl.dispose();
    _meetingCtl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    final validExpertises = _expertises
        .where((e) => e.topic.trim().isNotEmpty)
        .toList();
    if (validExpertises.isEmpty) {
      AppToast.info(context, 'Vui lòng thêm ít nhất một lĩnh vực chuyên môn');
      return;
    }
    if (!_termsAccepted) {
      AppToast.info(context, 'Vui lòng đồng ý điều khoản');
      return;
    }

    setState(() => _submitting = true);
    try {
      final repo = ref.read(mentorshipRepositoryProvider);
      await repo.createMentorProfile(
        currentJobTitle: _jobCtl.text.trim(),
        currentCompany: _companyCtl.text.trim(),
        bio: _bioCtl.text.trim(),
        defaultMeetingLink: _meetingCtl.text.trim(),
      );
      for (final e in validExpertises) {
        await repo.addExpertise(
          topic: e.topic.trim(),
          category: e.category,
          yearsExperience: e.years,
          description: e.description.trim(),
        );
      }
      ref.invalidate(myMentorProfileProvider);
      if (!mounted) return;
      AppToast.success(context, 'Đăng ký cố vấn thành công! Hồ sơ đang chờ duyệt.');
      Navigator.of(context).pop();
    } catch (e) {
      if (!mounted) return;
      AppToast.fromError(context, e, fallback: 'Đăng ký cố vấn thất bại');
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Trở thành cố vấn')),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            const _Label('Thông tin cố vấn'),
            const SizedBox(height: 12),
            TextFormField(
              controller: _jobCtl,
              validator: (v) => (v == null || v.trim().isEmpty)
                  ? 'Vui lòng nhập chức danh'
                  : null,
              decoration: const InputDecoration(
                labelText: 'Chức danh hiện tại *',
                hintText: 'VD: Senior Software Engineer',
                prefixIcon: Icon(Icons.work_outline),
              ),
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _companyCtl,
              validator: (v) => (v == null || v.trim().isEmpty)
                  ? 'Vui lòng nhập công ty'
                  : null,
              decoration: const InputDecoration(
                labelText: 'Công ty *',
                hintText: 'VD: FPT Software',
                prefixIcon: Icon(Icons.apartment_outlined),
              ),
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _bioCtl,
              maxLines: 4,
              validator: (v) => (v == null || v.trim().isEmpty)
                  ? 'Vui lòng giới thiệu bản thân'
                  : null,
              decoration: const InputDecoration(
                labelText: 'Giới thiệu *',
                hintText: 'Mô tả ngắn về kinh nghiệm và lĩnh vực bạn có thể hỗ trợ...',
                alignLabelWithHint: true,
              ),
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _meetingCtl,
              keyboardType: TextInputType.url,
              decoration: const InputDecoration(
                labelText: 'Link họp mặc định (tùy chọn)',
                hintText: 'VD: https://meet.google.com/...',
                prefixIcon: Icon(Icons.video_call_outlined),
              ),
            ),
            const SizedBox(height: 24),
            Row(
              children: [
                const Expanded(child: _Label('Lĩnh vực chuyên môn')),
                TextButton.icon(
                  onPressed: () =>
                      setState(() => _expertises.add(_ExpertiseDraft())),
                  icon: const Icon(Icons.add, size: 18),
                  label: const Text('Thêm'),
                ),
              ],
            ),
            const SizedBox(height: 8),
            ..._expertises.asMap().entries.map(
                  (e) => _ExpertiseCard(
                    draft: e.value,
                    index: e.key,
                    canRemove: _expertises.length > 1,
                    onRemove: () =>
                        setState(() => _expertises.removeAt(e.key)),
                  ),
                ),
            const SizedBox(height: 16),
            CheckboxListTile(
              value: _termsAccepted,
              onChanged: (v) => setState(() => _termsAccepted = v ?? false),
              controlAffinity: ListTileControlAffinity.leading,
              contentPadding: EdgeInsets.zero,
              title: const Text(
                'Tôi đồng ý với điều khoản chương trình cố vấn',
                style: TextStyle(fontSize: 14),
              ),
            ),
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: _submitting ? null : _submit,
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 14),
                ),
                child: _submitting
                    ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(
                            strokeWidth: 2, color: Colors.white))
                    : const Text('Gửi đăng ký', style: TextStyle(fontSize: 16)),
              ),
            ),
            const SizedBox(height: 8),
            const Text(
              'Hồ sơ của bạn sẽ được quản trị viên duyệt trước khi hiển thị.',
              textAlign: TextAlign.center,
              style: TextStyle(color: AppColors.textSecondary, fontSize: 12.5),
            ),
          ],
        ),
      ),
    );
  }
}

class _ExpertiseCard extends StatelessWidget {
  const _ExpertiseCard({
    required this.draft,
    required this.index,
    required this.canRemove,
    required this.onRemove,
  });

  final _ExpertiseDraft draft;
  final int index;
  final bool canRemove;
  final VoidCallback onRemove;

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(10),
        side: const BorderSide(color: AppColors.divider),
      ),
      elevation: 0,
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          children: [
            Row(
              children: [
                Expanded(
                  child: TextFormField(
                    initialValue: draft.topic,
                    onChanged: (v) => draft.topic = v,
                    decoration: const InputDecoration(
                      labelText: 'Chủ đề *',
                      hintText: 'VD: Lập trình web',
                      isDense: true,
                    ),
                  ),
                ),
                if (canRemove)
                  IconButton(
                    onPressed: onRemove,
                    icon: const Icon(Icons.delete_outline,
                        color: AppColors.error),
                  ),
              ],
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                Expanded(
                  flex: 3,
                  child: DropdownButtonFormField<String>(
                    value: draft.category,
                    isExpanded: true,
                    decoration: const InputDecoration(
                        labelText: 'Lĩnh vực', isDense: true),
                    items: _categories
                        .map((c) => DropdownMenuItem(
                            value: c.$1, child: Text(c.$2)))
                        .toList(),
                    onChanged: (v) => draft.category = v ?? 'CAREER',
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  flex: 2,
                  child: TextFormField(
                    initialValue: draft.years?.toString() ?? '',
                    keyboardType: TextInputType.number,
                    onChanged: (v) => draft.years = int.tryParse(v),
                    decoration: const InputDecoration(
                        labelText: 'Năm KN', isDense: true),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _Label extends StatelessWidget {
  const _Label(this.text);
  final String text;

  @override
  Widget build(BuildContext context) {
    return Text(text,
        style: const TextStyle(
            fontWeight: FontWeight.w700,
            fontSize: 15,
            color: AppColors.primary));
  }
}
