import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../shared/widgets/app_toast.dart';
import '../../data/models/mentor_availability.dart';
import '../../data/repositories/mentorship_repository.dart';
import '../providers/mentorship_providers.dart';

/// Mentor availability management — view, add and delete open time slots.
class MentorAvailabilityPage extends ConsumerWidget {
  const MentorAvailabilityPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(myAvailabilityProvider);

    return Scaffold(
      appBar: AppBar(title: Text('mentorship.my_availability'.tr())),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _showAddSlot(context, ref),
        icon: const Icon(Icons.add),
        label: Text('mentorship.add_slot'.tr()),
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(myAvailabilityProvider);
          await ref.read(myAvailabilityProvider.future);
        },
        child: async.when(
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (e, _) => ListView(
            children: [
              const SizedBox(height: 120),
              Center(
                child: Column(
                  children: [
                    Text('mentorship.availability_load_failed'.tr()),
                    TextButton(
                      onPressed: () => ref.invalidate(myAvailabilityProvider),
                      child: Text('common.retry'.tr()),
                    ),
                  ],
                ),
              ),
            ],
          ),
          data: (slots) {
            // Sort: upcoming first, past after
            final now = DateTime.now();
            final sorted = [...slots]
              ..sort((a, b) => a.startTime.compareTo(b.startTime));
            final upcoming =
                sorted.where((s) => s.endTime.isAfter(now)).toList();
            final past =
                sorted.where((s) => !s.endTime.isAfter(now)).toList();

            if (slots.isEmpty) {
              return ListView(
                children: [
                  const SizedBox(height: 120),
                  const Icon(Icons.calendar_today_outlined,
                      size: 48, color: AppColors.textSecondary),
                  const SizedBox(height: 12),
                  Center(
                    child: Text(
                      'mentorship.no_slots_hint'.tr(),
                      textAlign: TextAlign.center,
                      style: const TextStyle(color: AppColors.textSecondary),
                    ),
                  ),
                ],
              );
            }

            return ListView(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 100),
              children: [
                if (upcoming.isNotEmpty) ...[
                  _GroupLabel('mentorship.upcoming_slots'.tr()),
                  ...upcoming.map((s) => _SlotTile(slot: s)),
                ],
                if (past.isNotEmpty) ...[
                  _GroupLabel('mentorship.past_slots'.tr()),
                  ...past.map((s) => _SlotTile(slot: s, isPast: true)),
                ],
              ],
            );
          },
        ),
      ),
    );
  }

  Future<void> _showAddSlot(BuildContext context, WidgetRef ref) async {
    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (_) => const _AddSlotSheet(),
    );
    // Refresh after sheet closes (success or cancel)
    ref.invalidate(myAvailabilityProvider);
  }
}

class _SlotTile extends ConsumerWidget {
  const _SlotTile({required this.slot, this.isPast = false});

  final MentorAvailability slot;
  final bool isPast;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final df = DateFormat('EEE dd/MM/yyyy');
    final tf = DateFormat('HH:mm');
    final st = (slot.status ?? '').toUpperCase();
    final isBooked = st == 'BOOKED';

    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      color: isPast ? AppColors.background : AppColors.surface,
      child: ListTile(
        leading: Icon(
          isBooked ? Icons.event_available : Icons.schedule,
          color: isBooked
              ? AppColors.success
              : isPast
                  ? AppColors.textSecondary
                  : AppColors.primary,
        ),
        title: Text(
          df.format(slot.startTime),
          style: TextStyle(
            fontWeight: FontWeight.w600,
            color: isPast ? AppColors.textSecondary : AppColors.textPrimary,
          ),
        ),
        subtitle: Text(
          '${tf.format(slot.startTime)} – ${tf.format(slot.endTime)}'
          '${isBooked ? ' · ${'mentorship.slot_booked'.tr()}' : ''}',
          style: const TextStyle(fontSize: 13),
        ),
        trailing: (!isBooked && !isPast)
            ? IconButton(
                tooltip: 'mentorship.delete_slot'.tr(),
                icon: const Icon(Icons.delete_outline, color: AppColors.error),
                onPressed: () => _delete(context, ref),
              )
            : null,
      ),
    );
  }

  Future<void> _delete(BuildContext context, WidgetRef ref) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: Text('mentorship.delete_slot_title'.tr()),
        content: Text('mentorship.delete_slot_content'.tr()),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(context, false),
              child: Text('common.cancel'.tr())),
          TextButton(
              onPressed: () => Navigator.pop(context, true),
              child: Text('common.delete'.tr(),
                  style: const TextStyle(color: AppColors.error))),
        ],
      ),
    );
    if (ok != true) return;
    try {
      await ref.read(mentorshipRepositoryProvider).deleteAvailability(slot.id);
      ref.invalidate(myAvailabilityProvider);
      if (context.mounted) {
        AppToast.success(context, 'mentorship.slot_deleted'.tr());
      }
    } catch (e) {
      if (context.mounted) {
        AppToast.fromError(context, e);
      }
    }
  }
}

class _AddSlotSheet extends ConsumerStatefulWidget {
  const _AddSlotSheet();

  @override
  ConsumerState<_AddSlotSheet> createState() => _AddSlotSheetState();
}

class _AddSlotSheetState extends ConsumerState<_AddSlotSheet> {
  DateTime? _date;
  TimeOfDay? _startTime;
  TimeOfDay? _endTime;
  bool _saving = false;

  Future<void> _pickDate() async {
    final d = await showDatePicker(
      context: context,
      initialDate: DateTime.now().add(const Duration(days: 1)),
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 90)),
    );
    if (d != null) setState(() => _date = d);
  }

  Future<void> _pickTime(bool isStart) async {
    final t = await showTimePicker(
      context: context,
      initialTime: isStart
          ? const TimeOfDay(hour: 9, minute: 0)
          : const TimeOfDay(hour: 10, minute: 0),
    );
    if (t != null) {
      setState(() {
        if (isStart) {
          _startTime = t;
        } else {
          _endTime = t;
        }
      });
    }
  }

  DateTime _combine(DateTime date, TimeOfDay time) =>
      DateTime(date.year, date.month, date.day, time.hour, time.minute);

  Future<void> _save() async {
    if (_date == null || _startTime == null || _endTime == null) {
      AppToast.info(context, 'mentorship.slot_fill_required'.tr());
      return;
    }
    final start = _combine(_date!, _startTime!);
    final end = _combine(_date!, _endTime!);
    if (!end.isAfter(start)) {
      AppToast.error(context, 'mentorship.slot_end_after_start'.tr());
      return;
    }

    setState(() => _saving = true);
    try {
      await ref
          .read(mentorshipRepositoryProvider)
          .addAvailability(startTime: start, endTime: end);
      ref.invalidate(myAvailabilityProvider);
      if (!mounted) return;
      Navigator.of(context).pop();
      AppToast.success(context, 'mentorship.slot_added'.tr());
    } catch (e) {
      if (!mounted) return;
      AppToast.fromError(context, e);
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final df = DateFormat('dd/MM/yyyy');
    final tf = DateFormat('HH:mm');
    final now = DateTime.now();

    return Padding(
      padding: EdgeInsets.only(
        left: 24,
        right: 24,
        top: 24,
        bottom: MediaQuery.of(context).viewInsets.bottom + 24,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('mentorship.add_slot_title'.tr(),
              style:
                  const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
          const SizedBox(height: 20),
          _PickerTile(
            icon: Icons.calendar_today,
            label: 'mentorship.slot_date'.tr(),
            value: _date != null ? df.format(_date!) : 'mentorship.pick_date'.tr(),
            onTap: _pickDate,
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: _PickerTile(
                  icon: Icons.access_time,
                  label: 'mentorship.slot_start'.tr(),
                  value: _startTime != null
                      ? tf.format(_combine(
                          _date ?? now, _startTime!))
                      : 'mentorship.pick_time'.tr(),
                  onTap: () => _pickTime(true),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _PickerTile(
                  icon: Icons.access_time_filled,
                  label: 'mentorship.slot_end'.tr(),
                  value: _endTime != null
                      ? tf.format(_combine(
                          _date ?? now, _endTime!))
                      : 'mentorship.pick_time'.tr(),
                  onTap: () => _pickTime(false),
                ),
              ),
            ],
          ),
          const SizedBox(height: 24),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: _saving ? null : _save,
              style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 14)),
              child: _saving
                  ? const SizedBox(
                      height: 20,
                      width: 20,
                      child: CircularProgressIndicator(
                          strokeWidth: 2, color: Colors.white))
                  : Text('mentorship.save_slot'.tr(),
                      style: const TextStyle(fontSize: 16)),
            ),
          ),
        ],
      ),
    );
  }
}

class _PickerTile extends StatelessWidget {
  const _PickerTile({
    required this.icon,
    required this.label,
    required this.value,
    required this.onTap,
  });

  final IconData icon;
  final String label;
  final String value;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        decoration: BoxDecoration(
          border: Border.all(color: AppColors.divider),
          borderRadius: BorderRadius.circular(8),
          color: AppColors.surface,
        ),
        child: Row(
          children: [
            Icon(icon, size: 18, color: AppColors.primary),
            const SizedBox(width: 8),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(label,
                      style: const TextStyle(
                          color: AppColors.textSecondary, fontSize: 11)),
                  Text(value,
                      style: const TextStyle(
                          fontWeight: FontWeight.w600, fontSize: 14)),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _GroupLabel extends StatelessWidget {
  const _GroupLabel(this.text);
  final String text;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Text(
        text.toUpperCase(),
        style: const TextStyle(
            color: AppColors.primary,
            fontWeight: FontWeight.w700,
            fontSize: 12,
            letterSpacing: 0.5),
      ),
    );
  }
}
