import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../../../../core/theme/app_colors.dart';
import '../../data/models/mentor_availability.dart';
import '../../data/repositories/mentorship_repository.dart';
import '../providers/mentorship_providers.dart';

const _sessionTypes = <(String, String)>[
  ('CAREER', 'Nghề nghiệp'),
  ('ACADEMIC', 'Học thuật'),
  ('SOFT_SKILLS', 'Kỹ năng mềm'),
];

/// Book a session with a mentor: pick an available slot, fill in the form,
/// then POST to `/mentee/sessions/book`.
class MentorBookingPage extends ConsumerStatefulWidget {
  const MentorBookingPage({super.key, required this.memberId});

  final int memberId;

  @override
  ConsumerState<MentorBookingPage> createState() => _MentorBookingPageState();
}

class _MentorBookingPageState extends ConsumerState<MentorBookingPage> {
  final _formKey = GlobalKey<FormState>();
  final _introCtl = TextEditingController();
  final _descCtl = TextEditingController();

  MentorAvailability? _slot;
  String? _sessionType;
  bool _submitting = false;

  @override
  void dispose() {
    _introCtl.dispose();
    _descCtl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (_slot == null) {
      _toast('Vui lòng chọn khung giờ');
      return;
    }
    if (!_formKey.currentState!.validate()) return;

    setState(() => _submitting = true);
    try {
      await ref.read(mentorshipRepositoryProvider).bookSession(
            availabilityId: _slot!.id,
            sessionType: _sessionType!,
            introduction: _introCtl.text.trim(),
            description: _descCtl.text.trim(),
            bookingNote: _descCtl.text.trim(),
          );
      ref.invalidate(mySessionsProvider);
      ref.invalidate(mentorAvailabilityProvider(widget.memberId));
      if (!mounted) return;
      _toast('Đặt lịch thành công!');
      Navigator.of(context).pop();
    } catch (e) {
      if (!mounted) return;
      _toast(e.toString().replaceFirst('Exception: ', ''));
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  void _toast(String msg) => ScaffoldMessenger.of(context)
      .showSnackBar(SnackBar(content: Text(msg)));

  @override
  Widget build(BuildContext context) {
    final slotsAsync = ref.watch(mentorAvailabilityProvider(widget.memberId));

    return Scaffold(
      appBar: AppBar(title: const Text('Đặt lịch hẹn')),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            const _Label('1. Chọn khung giờ'),
            const SizedBox(height: 8),
            slotsAsync.when(
              loading: () => const Center(
                  child: Padding(
                      padding: EdgeInsets.all(20),
                      child: CircularProgressIndicator())),
              error: (e, _) => const Text('Không tải được khung giờ.'),
              data: (slots) {
                final open = slots
                    .where((s) =>
                        (s.status == null || s.status == 'AVAILABLE') &&
                        s.startTime.isAfter(DateTime.now()))
                    .toList();
                if (open.isEmpty) {
                  return const Padding(
                    padding: EdgeInsets.symmetric(vertical: 12),
                    child: Text('Cố vấn chưa mở khung giờ rảnh nào.',
                        style: TextStyle(color: AppColors.textSecondary)),
                  );
                }
                return Column(
                  children: open.map((s) => _SlotTile(
                        slot: s,
                        selected: _slot?.id == s.id,
                        onTap: () => setState(() => _slot = s),
                      )).toList(),
                );
              },
            ),
            const SizedBox(height: 20),
            const _Label('2. Loại buổi hẹn'),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              children: _sessionTypes.map((t) {
                final selected = _sessionType == t.$1;
                return ChoiceChip(
                  label: Text(t.$2),
                  selected: selected,
                  onSelected: (_) => setState(() => _sessionType = t.$1),
                );
              }).toList(),
            ),
            if (_sessionType == null)
              const Padding(
                padding: EdgeInsets.only(top: 6),
                child: Text('Vui lòng chọn loại buổi hẹn',
                    style: TextStyle(color: AppColors.error, fontSize: 12)),
              ),
            const SizedBox(height: 20),
            const _Label('3. Thông tin'),
            const SizedBox(height: 8),
            TextFormField(
              controller: _introCtl,
              maxLines: 3,
              validator: (v) => (v == null || v.trim().isEmpty)
                  ? 'Vui lòng giới thiệu ngắn về bạn'
                  : null,
              decoration: const InputDecoration(
                labelText: 'Giới thiệu *',
                hintText: 'Giới thiệu ngắn về bạn và mục tiêu...',
                alignLabelWithHint: true,
              ),
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _descCtl,
              maxLines: 4,
              decoration: const InputDecoration(
                labelText: 'Nội dung mong muốn trao đổi',
                alignLabelWithHint: true,
              ),
            ),
            const SizedBox(height: 24),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: (_submitting || _sessionType == null) ? null : _submit,
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 14),
                ),
                child: _submitting
                    ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(
                            strokeWidth: 2, color: Colors.white))
                    : const Text('Xác nhận đặt lịch',
                        style: TextStyle(fontSize: 16)),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _SlotTile extends StatelessWidget {
  const _SlotTile({
    required this.slot,
    required this.selected,
    required this.onTap,
  });

  final MentorAvailability slot;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final df = DateFormat('dd/MM/yyyy');
    final tf = DateFormat('HH:mm');
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      color: selected ? AppColors.primary.withValues(alpha: 0.08) : null,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(10),
        side: BorderSide(
          color: selected ? AppColors.primary : AppColors.divider,
          width: selected ? 1.5 : 1,
        ),
      ),
      elevation: 0,
      child: ListTile(
        onTap: onTap,
        leading: Icon(
          selected ? Icons.radio_button_checked : Icons.radio_button_off,
          color: selected ? AppColors.primary : AppColors.textSecondary,
        ),
        title: Text(df.format(slot.startTime)),
        subtitle: Text(
            '${tf.format(slot.startTime)} - ${tf.format(slot.endTime)}'),
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
            fontWeight: FontWeight.w700, fontSize: 15, color: AppColors.primary));
  }
}
