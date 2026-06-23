import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_spacing.dart';
import '../../data/models/event_question.dart';

/// Bottom sheet that collects answers to an event's registration questions.
/// Returns the answers list (`[{questionId, value}]`) on submit, or null if
/// dismissed. `value` is a String (text/single) or `List<String>` (multi).
class EventRegisterSheet extends StatefulWidget {
  const EventRegisterSheet({
    super.key,
    required this.eventTitle,
    required this.questions,
  });

  final String eventTitle;
  final List<EventQuestion> questions;

  /// Opens the sheet; returns answers or null.
  static Future<List<Map<String, dynamic>>?> show(
    BuildContext context, {
    required String eventTitle,
    required List<EventQuestion> questions,
  }) {
    return showModalBottomSheet<List<Map<String, dynamic>>>(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppColors.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(AppRadius.lg)),
      ),
      builder: (_) =>
          EventRegisterSheet(eventTitle: eventTitle, questions: questions),
    );
  }

  @override
  State<EventRegisterSheet> createState() => _EventRegisterSheetState();
}

class _EventRegisterSheetState extends State<EventRegisterSheet> {
  final _formKey = GlobalKey<FormState>();
  // questionId -> answer (String for text/single, Set<String> for multi)
  final Map<int, dynamic> _answers = {};

  void _submit() {
    // Validate required questions (text via Form; choice manually).
    final formOk = _formKey.currentState?.validate() ?? true;
    String? choiceError;
    for (final q in widget.questions) {
      if (!q.required) continue;
      if (q.isSingleChoice && (_answers[q.id] == null)) {
        choiceError = q.label;
        break;
      }
      if (q.isMultiChoice &&
          (_answers[q.id] == null || (_answers[q.id] as Set).isEmpty)) {
        choiceError = q.label;
        break;
      }
    }
    if (!formOk || choiceError != null) {
      if (choiceError != null) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              'event.answer_required'.tr(namedArgs: {'question': choiceError}),
            ),
          ),
        );
      }
      return;
    }

    final result = <Map<String, dynamic>>[];
    for (final q in widget.questions) {
      final a = _answers[q.id];
      if (a == null) continue;
      if (q.isMultiChoice) {
        final list = (a as Set<String>).toList();
        if (list.isNotEmpty) result.add({'questionId': q.id, 'value': list});
      } else {
        final s = (a as String).trim();
        if (s.isNotEmpty) result.add({'questionId': q.id, 'value': s});
      }
    }
    Navigator.of(context).pop(result);
  }

  @override
  Widget build(BuildContext context) {
    final bottomInset = MediaQuery.of(context).viewInsets.bottom;
    return Padding(
      padding: EdgeInsets.only(bottom: bottomInset),
      child: DraggableScrollableSheet(
        expand: false,
        initialChildSize: 0.7,
        maxChildSize: 0.92,
        minChildSize: 0.4,
        builder: (_, scrollCtl) => Column(
          children: [
            const SizedBox(height: AppSpacing.sm),
            Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: AppColors.divider,
                borderRadius: BorderRadius.circular(AppRadius.pill),
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(AppSpacing.lg),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('event.register_sheet_title'.tr(),
                      style: const TextStyle(
                          fontSize: 18, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 2),
                  Text(widget.eventTitle,
                      style: const TextStyle(color: AppColors.textSecondary)),
                ],
              ),
            ),
            const Divider(height: 1),
            Expanded(
              child: Form(
                key: _formKey,
                child: ListView(
                  controller: scrollCtl,
                  padding: const EdgeInsets.all(AppSpacing.lg),
                  children: [
                    for (final q in widget.questions) ...[
                      _QuestionField(
                        question: q,
                        value: _answers[q.id],
                        onChanged: (v) => setState(() => _answers[q.id] = v),
                      ),
                      const SizedBox(height: AppSpacing.lg),
                    ],
                  ],
                ),
              ),
            ),
            SafeArea(
              top: false,
              child: Padding(
                padding: const EdgeInsets.all(AppSpacing.lg),
                child: SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: _submit,
                    style: ElevatedButton.styleFrom(
                      padding:
                          const EdgeInsets.symmetric(vertical: AppSpacing.md),
                    ),
                    child: Text('event.confirm_join'.tr(),
                        style: const TextStyle(fontSize: 16)),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _QuestionField extends StatelessWidget {
  const _QuestionField({
    required this.question,
    required this.value,
    required this.onChanged,
  });

  final EventQuestion question;
  final dynamic value;
  final ValueChanged<dynamic> onChanged;

  @override
  Widget build(BuildContext context) {
    final label = Row(
      children: [
        Flexible(
          child: Text(question.label,
              style: const TextStyle(fontWeight: FontWeight.w600)),
        ),
        if (question.required)
          const Text(' *', style: TextStyle(color: AppColors.error)),
      ],
    );

    if (question.isShortText) {
      return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          label,
          const SizedBox(height: AppSpacing.sm),
          TextFormField(
            initialValue: value as String?,
            validator: question.required
                ? (v) => (v == null || v.trim().isEmpty)
                    ? 'event.required'.tr()
                    : null
                : null,
            decoration: InputDecoration(
              hintText: 'event.answer_hint'.tr(),
              border: const OutlineInputBorder(),
              isDense: true,
            ),
            onChanged: onChanged,
          ),
        ],
      );
    }

    if (question.isSingleChoice) {
      final selected = value as String?;
      return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          label,
          for (final opt in question.options)
            RadioListTile<String>(
              contentPadding: EdgeInsets.zero,
              dense: true,
              value: opt,
              groupValue: selected,
              title: Text(opt),
              activeColor: AppColors.primary,
              onChanged: (v) => onChanged(v),
            ),
        ],
      );
    }

    // MULTI_CHOICE
    final selected = (value as Set<String>?) ?? <String>{};
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        label,
        for (final opt in question.options)
          CheckboxListTile(
            contentPadding: EdgeInsets.zero,
            dense: true,
            controlAffinity: ListTileControlAffinity.leading,
            value: selected.contains(opt),
            title: Text(opt),
            activeColor: AppColors.primary,
            onChanged: (checked) {
              final next = Set<String>.from(selected);
              if (checked == true) {
                next.add(opt);
              } else {
                next.remove(opt);
              }
              onChanged(next);
            },
          ),
      ],
    );
  }
}
