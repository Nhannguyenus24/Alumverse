import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/theme/app_colors.dart';
import '../providers/fundraising_provider.dart';

/// Filter sheet for the fund list — mirrors the web `DynamicFilterBar`:
/// status, start-date range, and donation-amount range.
/// Pops the updated [FundQuery] (page reset to 0) on "Áp dụng".
class FundFilterSheet extends ConsumerStatefulWidget {
  const FundFilterSheet({super.key, required this.initial});

  final FundQuery initial;

  @override
  ConsumerState<FundFilterSheet> createState() => _FundFilterSheetState();
}

class _FundFilterSheetState extends ConsumerState<FundFilterSheet> {
  late DateTime? _dateFrom;
  late DateTime? _dateTo;
  late final TextEditingController _minController;
  late final TextEditingController _maxController;

  @override
  void initState() {
    super.initState();
    _dateFrom = widget.initial.dateFrom;
    _dateTo = widget.initial.dateTo;
    _minController = TextEditingController(
      text: widget.initial.amountMin?.toString() ?? '',
    );
    _maxController = TextEditingController(
      text: widget.initial.amountMax?.toString() ?? '',
    );
  }

  @override
  void dispose() {
    _minController.dispose();
    _maxController.dispose();
    super.dispose();
  }

  Future<void> _pickDate({required bool from}) async {
    final now = DateTime.now();
    final initial = (from ? _dateFrom : _dateTo) ?? now;
    final picked = await showDatePicker(
      context: context,
      initialDate: initial,
      firstDate: DateTime(now.year - 5),
      lastDate: DateTime(now.year + 5),
    );
    if (picked != null) {
      setState(() {
        if (from) {
          _dateFrom = picked;
        } else {
          _dateTo = picked;
        }
      });
    }
  }

  void _reset() {
    setState(() {
      _dateFrom = null;
      _dateTo = null;
      _minController.clear();
      _maxController.clear();
    });
  }

  void _apply() {
    final min = int.tryParse(_minController.text.trim());
    final max = int.tryParse(_maxController.text.trim());
    Navigator.of(context).pop(
      widget.initial.copyWith(
        amountMin: min,
        clearAmountMin: min == null,
        amountMax: max,
        clearAmountMax: max == null,
        dateFrom: _dateFrom,
        clearDateFrom: _dateFrom == null,
        dateTo: _dateTo,
        clearDateTo: _dateTo == null,
        page: 0,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final df = DateFormat('dd/MM/yyyy');

    return SafeArea(
      child: Padding(
        padding: EdgeInsets.only(
          left: 16,
          right: 16,
          top: 16,
          bottom: MediaQuery.of(context).viewInsets.bottom + 16,
        ),
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Text(
                    'donation.filter_title'.tr(),
                    style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const Spacer(),
                  TextButton(
                    onPressed: _reset,
                    child: Text('donation.filter_reset'.tr()),
                  ),
                ],
              ),
              const SizedBox(height: 8),

              // Start date range
              _Label('donation.filter_start_time'.tr()),
              const SizedBox(height: 6),
              Row(
                children: [
                  Expanded(
                    child: _DateField(
                      label: 'donation.filter_date_from'.tr(),
                      value: _dateFrom != null ? df.format(_dateFrom!) : null,
                      onTap: () => _pickDate(from: true),
                      onClear:
                          _dateFrom != null
                              ? () => setState(() => _dateFrom = null)
                              : null,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _DateField(
                      label: 'donation.filter_date_to'.tr(),
                      value: _dateTo != null ? df.format(_dateTo!) : null,
                      onTap: () => _pickDate(from: false),
                      onClear:
                          _dateTo != null
                              ? () => setState(() => _dateTo = null)
                              : null,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),

              // Amount range
              _Label('donation.filter_amount_range'.tr()),
              const SizedBox(height: 6),
              Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _minController,
                      keyboardType: TextInputType.number,
                      inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                      decoration: InputDecoration(
                        labelText: 'donation.filter_amount_min'.tr(),
                        border: const OutlineInputBorder(),
                        isDense: true,
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: TextField(
                      controller: _maxController,
                      keyboardType: TextInputType.number,
                      inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                      decoration: InputDecoration(
                        labelText: 'donation.filter_amount_max'.tr(),
                        border: const OutlineInputBorder(),
                        isDense: true,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 20),

              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: _apply,
                  style: ElevatedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 14),
                  ),
                  child: Text(
                    'donation.filter_apply'.tr(),
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
              ),
            ],
          ),
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
    return Text(
      text,
      style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
    );
  }
}

class _DateField extends StatelessWidget {
  const _DateField({
    required this.label,
    required this.value,
    required this.onTap,
    this.onClear,
  });

  final String label;
  final String? value;
  final VoidCallback onTap;
  final VoidCallback? onClear;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(4),
      child: InputDecorator(
        decoration: InputDecoration(
          labelText: label,
          border: const OutlineInputBorder(),
          isDense: true,
          contentPadding: const EdgeInsets.symmetric(
            horizontal: 12,
            vertical: 14,
          ),
          suffixIcon:
              onClear != null
                  ? InkWell(
                    onTap: onClear,
                    child: const Icon(Icons.clear, size: 18),
                  )
                  : const Icon(Icons.calendar_today_outlined, size: 16),
        ),
        child: Text(
          value ?? '—',
          style: TextStyle(
            color: value != null ? null : AppColors.textSecondary,
          ),
        ),
      ),
    );
  }
}
