import 'package:dio/dio.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/errors/api_exception.dart';
import '../../../../core/router/route_names.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../shared/widgets/app_toast.dart';
import '../../data/models/mentor_availability.dart';
import '../../data/repositories/mentorship_repository.dart';
import '../providers/mentorship_providers.dart';

List<(String, String)> _sessionTypes(BuildContext context) => [
  ('CAREER', 'mentorship.type_career'.tr()),
  ('ACADEMIC', 'mentorship.type_academic'.tr()),
  ('SOFT_SKILLS', 'mentorship.type_soft_skills'.tr()),
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
  // Day (yyyy-mm-dd) currently expanded in the slot picker, so a mentor with
  // many slots is grouped by date instead of one long flat list.
  DateTime? _selectedDay;
  // Optional date-range filter (inclusive) to narrow the slot list.
  DateTime? _rangeStart;
  DateTime? _rangeEnd;

  /// Pick a start/end day for the range filter.
  Future<void> _pickRange(bool isStart) async {
    final now = DateTime.now();
    final initial = (isStart ? _rangeStart : _rangeEnd) ?? now;
    final picked = await showDatePicker(
      context: context,
      initialDate: initial.isBefore(now) ? now : initial,
      firstDate: now,
      lastDate: now.add(const Duration(days: 365)),
    );
    if (picked == null) return;
    setState(() {
      final day = DateTime(picked.year, picked.month, picked.day);
      if (isStart) {
        _rangeStart = day;
        if (_rangeEnd != null && _rangeEnd!.isBefore(day)) _rangeEnd = day;
      } else {
        _rangeEnd = day;
        if (_rangeStart != null && _rangeStart!.isAfter(day)) _rangeStart = day;
      }
      _selectedDay = null; // re-default to first day in the filtered set
      _slot = null;
    });
  }

  @override
  void dispose() {
    _introCtl.dispose();
    _descCtl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (_slot == null) {
      AppToast.info(context, 'mentorship.booking_select_slot'.tr());
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
      AppToast.success(context, 'mentorship.booking_success'.tr());
      Navigator.of(context).pop();
    } catch (e) {
      if (!mounted) return;
      AppToast.error(context, e.toString().replaceFirst('Exception: ', ''));
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final slotsAsync = ref.watch(mentorAvailabilityProvider(widget.memberId));
    final sessionTypes = _sessionTypes(context);

    return Scaffold(
      appBar: AppBar(title: Text('mentorship.book_appointment'.tr())),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            _Label('1. ${'mentorship.booking_step_slot'.tr()}'),
            const SizedBox(height: 8),
            slotsAsync.when(
              loading: () => const Center(
                  child: Padding(
                      padding: EdgeInsets.all(20),
                      child: CircularProgressIndicator())),
              error: (e, _) => _SlotsError(error: e),
              data: (slots) {
                final allOpen = slots
                    .where((s) =>
                        (s.status == null || s.status == 'AVAILABLE') &&
                        s.startTime.isAfter(DateTime.now()))
                    .toList()
                  ..sort((a, b) => a.startTime.compareTo(b.startTime));
                if (allOpen.isEmpty) {
                  return Padding(
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    child: Text('mentorship.no_open_slots'.tr(),
                        style: const TextStyle(color: AppColors.textSecondary)),
                  );
                }

                // Apply the optional date-range filter (inclusive of both ends).
                final open = allOpen.where((s) {
                  final d = DateTime(
                      s.startTime.year, s.startTime.month, s.startTime.day);
                  if (_rangeStart != null && d.isBefore(_rangeStart!)) {
                    return false;
                  }
                  if (_rangeEnd != null && d.isAfter(_rangeEnd!)) return false;
                  return true;
                }).toList();

                final rangeRow = _RangeFilter(
                  start: _rangeStart,
                  end: _rangeEnd,
                  onPickStart: () => _pickRange(true),
                  onPickEnd: () => _pickRange(false),
                  onClear: (_rangeStart == null && _rangeEnd == null)
                      ? null
                      : () => setState(() {
                            _rangeStart = null;
                            _rangeEnd = null;
                            _selectedDay = null;
                            _slot = null;
                          }),
                );

                if (open.isEmpty) {
                  return Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      rangeRow,
                      const SizedBox(height: 10),
                      Text('mentorship.no_slots_in_range'.tr(),
                          style: const TextStyle(color: AppColors.textSecondary)),
                    ],
                  );
                }

                // Group slots by day so many slots stay manageable.
                final byDay = <DateTime, List<MentorAvailability>>{};
                for (final s in open) {
                  final d = DateTime(
                      s.startTime.year, s.startTime.month, s.startTime.day);
                  byDay.putIfAbsent(d, () => []).add(s);
                }
                final days = byDay.keys.toList()..sort();
                // Default the expanded day to the first available one.
                final selectedDay = (_selectedDay != null &&
                        byDay.containsKey(_selectedDay))
                    ? _selectedDay!
                    : days.first;
                final dayDf = DateFormat('dd/MM');
                final daySlots = byDay[selectedDay] ?? const [];

                return Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    rangeRow,
                    const SizedBox(height: 10),
                    // Date chips (horizontal scroll).
                    SizedBox(
                      height: 40,
                      child: ListView.separated(
                        scrollDirection: Axis.horizontal,
                        itemCount: days.length,
                        separatorBuilder: (_, __) => const SizedBox(width: 8),
                        itemBuilder: (_, i) {
                          final d = days[i];
                          final sel = d == selectedDay;
                          return ChoiceChip(
                            label: Text(
                                '${dayDf.format(d)} (${byDay[d]!.length})'),
                            selected: sel,
                            onSelected: (_) => setState(() {
                              _selectedDay = d;
                              _slot = null; // reset slot when day changes
                            }),
                            selectedColor: AppColors.primary,
                            labelStyle: TextStyle(
                              color: sel ? Colors.white : AppColors.textPrimary,
                              fontWeight: FontWeight.w600,
                              fontSize: 13,
                            ),
                          );
                        },
                      ),
                    ),
                    const SizedBox(height: 10),
                    // Time slots for the selected day.
                    for (final s in daySlots)
                      _SlotTile(
                        slot: s,
                        selected: _slot?.id == s.id,
                        onTap: () => setState(() => _slot = s),
                      ),
                  ],
                );
              },
            ),
            const SizedBox(height: 20),
            _Label('2. ${'mentorship.booking_step_type'.tr()}'),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              children: sessionTypes.map((t) {
                final selected = _sessionType == t.$1;
                return ChoiceChip(
                  label: Text(t.$2),
                  selected: selected,
                  onSelected: (_) => setState(() => _sessionType = t.$1),
                );
              }).toList(),
            ),
            if (_sessionType == null)
              Padding(
                padding: const EdgeInsets.only(top: 6),
                child: Text('mentorship.booking_select_type'.tr(),
                    style: const TextStyle(color: AppColors.error, fontSize: 12)),
              ),
            const SizedBox(height: 20),
            _Label('3. ${'mentorship.booking_step_info'.tr()}'),
            const SizedBox(height: 8),
            TextFormField(
              controller: _introCtl,
              maxLines: 3,
              validator: (v) => (v == null || v.trim().isEmpty)
                  ? 'mentorship.booking_intro_required'.tr()
                  : null,
              decoration: InputDecoration(
                labelText: 'mentorship.booking_intro_label'.tr(),
                hintText: 'mentorship.booking_intro_hint'.tr(),
                alignLabelWithHint: true,
              ),
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _descCtl,
              maxLines: 4,
              decoration: InputDecoration(
                labelText: 'mentorship.booking_desc_label'.tr(),
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
                    : Text('mentorship.booking_confirm'.tr(),
                        style: const TextStyle(fontSize: 16)),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Slot-load error. A 403 means the user isn't org-verified for mentorship —
/// guide them to verify their academics instead of a generic failure.
class _SlotsError extends StatelessWidget {
  const _SlotsError({required this.error});
  final Object error;

  int? get _status {
    final e = error;
    if (e is ApiException) return e.statusCode;
    if (e is DioException) {
      final inner = e.error;
      if (inner is ApiException) return inner.statusCode;
      return e.response?.statusCode;
    }
    return null;
  }

  @override
  Widget build(BuildContext context) {
    if (_status == 403) {
      return Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: AppColors.info.withValues(alpha: 0.08),
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: AppColors.info.withValues(alpha: 0.3)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'mentorship.verify_required_booking'.tr(),
              style: const TextStyle(fontWeight: FontWeight.w600),
            ),
            const SizedBox(height: 8),
            Align(
              alignment: Alignment.centerLeft,
              child: ElevatedButton.icon(
                onPressed: () =>
                    context.push(RouteNames.organizationRegistration),
                icon: const Icon(Icons.verified_user_outlined, size: 18),
                label: Text('mentorship.verify_academic'.tr()),
              ),
            ),
          ],
        ),
      );
    }
    return Text('mentorship.slots_load_failed'.tr(),
        style: const TextStyle(color: AppColors.textSecondary));
  }
}

/// Date-range filter for the slot picker.
class _RangeFilter extends StatelessWidget {
  const _RangeFilter({
    required this.start,
    required this.end,
    required this.onPickStart,
    required this.onPickEnd,
    this.onClear,
  });

  final DateTime? start;
  final DateTime? end;
  final VoidCallback onPickStart;
  final VoidCallback onPickEnd;
  final VoidCallback? onClear;

  @override
  Widget build(BuildContext context) {
    final df = DateFormat('dd/MM/yyyy');
    return Row(
      children: [
        Expanded(
          child: _DateButton(
            label: 'mentorship.range_from'.tr(),
            value: start != null ? df.format(start!) : null,
            onTap: onPickStart,
          ),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: _DateButton(
            label: 'mentorship.range_to'.tr(),
            value: end != null ? df.format(end!) : null,
            onTap: onPickEnd,
          ),
        ),
        if (onClear != null)
          IconButton(
            tooltip: 'mentorship.clear_filter'.tr(),
            onPressed: onClear,
            icon: const Icon(Icons.close, size: 20),
          ),
      ],
    );
  }
}

class _DateButton extends StatelessWidget {
  const _DateButton(
      {required this.label, required this.value, required this.onTap});
  final String label;
  final String? value;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return OutlinedButton.icon(
      onPressed: onTap,
      icon: const Icon(Icons.calendar_today_outlined, size: 16),
      label: Text(
        value ?? label,
        overflow: TextOverflow.ellipsis,
        style: TextStyle(
          color: value != null ? AppColors.textPrimary : AppColors.textSecondary,
          fontWeight: value != null ? FontWeight.w600 : FontWeight.w400,
        ),
      ),
      style: OutlinedButton.styleFrom(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 12),
        alignment: Alignment.centerLeft,
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
    final tf = DateFormat('HH:mm');
    final mins = slot.endTime.difference(slot.startTime).inMinutes;
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
        title: Text(
            '${tf.format(slot.startTime)} - ${tf.format(slot.endTime)}'),
        subtitle: mins > 0
            ? Text('mentorship.slot_duration_minutes'.tr(
                namedArgs: {'count': mins.toString()}))
            : null,
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
