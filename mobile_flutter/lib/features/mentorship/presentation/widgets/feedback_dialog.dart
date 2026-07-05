import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../shared/widgets/app_toast.dart';
import '../../data/repositories/mentorship_repository.dart';
import '../providers/mentorship_providers.dart';

/// Bottom sheet for rating + commenting a completed mentorship session.
/// Mirrors the web feedback form: rating 1–5, comment, isPublic toggle.
class FeedbackBottomSheet extends ConsumerStatefulWidget {
  const FeedbackBottomSheet({super.key, required this.sessionId});

  final int sessionId;

  @override
  ConsumerState<FeedbackBottomSheet> createState() =>
      _FeedbackBottomSheetState();
}

class _FeedbackBottomSheetState extends ConsumerState<FeedbackBottomSheet> {
  int _rating = 5;
  final _commentCtl = TextEditingController();
  bool _isPublic = true;
  bool _submitting = false;

  @override
  void dispose() {
    _commentCtl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    setState(() => _submitting = true);
    try {
      await ref
          .read(mentorshipRepositoryProvider)
          .submitFeedback(
            sessionId: widget.sessionId,
            rating: _rating,
            comment: _commentCtl.text.trim(),
            isPublic: _isPublic,
          );
      // Refresh sessions + any open mentor feedbacks list.
      ref.invalidate(mySessionsProvider);
      if (!mounted) return;
      Navigator.of(context).pop();
      AppToast.success(context, 'mentorship.feedback_thanks'.tr());
    } catch (e) {
      if (!mounted) return;
      AppToast.fromError(context, e);
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      // Push content above keyboard.
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
          Text(
            'mentorship.feedback_title'.tr(),
            style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 4),
          Text(
            'mentorship.feedback_subtitle'.tr(),
            style: const TextStyle(
              color: AppColors.textSecondary,
              fontSize: 13,
            ),
          ),
          const SizedBox(height: 20),
          Text(
            'mentorship.feedback_star_label'.tr(),
            style: const TextStyle(fontWeight: FontWeight.w600),
          ),
          const SizedBox(height: 8),
          Row(
            children: List.generate(
              5,
              (i) => GestureDetector(
                onTap: () => setState(() => _rating = i + 1),
                child: Padding(
                  padding: const EdgeInsets.only(right: 6),
                  child: Icon(
                    i < _rating ? Icons.star : Icons.star_border,
                    color: AppColors.secondary,
                    size: 36,
                  ),
                ),
              ),
            ),
          ),
          const SizedBox(height: 16),
          TextField(
            controller: _commentCtl,
            maxLines: 3,
            decoration: InputDecoration(
              labelText: 'mentorship.feedback_comment_label'.tr(),
              hintText: 'mentorship.feedback_comment_hint'.tr(),
              alignLabelWithHint: true,
            ),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Switch(
                value: _isPublic,
                onChanged: (v) => setState(() => _isPublic = v),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  'mentorship.feedback_public_label'.tr(),
                  style: const TextStyle(fontSize: 13),
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: _submitting ? null : _submit,
              style: ElevatedButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 14),
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
                        'mentorship.submit_feedback'.tr(),
                        style: const TextStyle(fontSize: 16),
                      ),
            ),
          ),
        ],
      ),
    );
  }
}
