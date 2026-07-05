import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../../../../core/theme/app_colors.dart';
import '../../data/models/session_feedback.dart';

/// Review card on the mentor public profile — mirrors web `MentorshipReviewCard`.
class FeedbackCard extends StatelessWidget {
  const FeedbackCard({super.key, required this.feedback});

  final SessionFeedback feedback;

  @override
  Widget build(BuildContext context) {
    final date =
        feedback.createdAt != null
            ? DateFormat('dd/MM/yyyy').format(feedback.createdAt!)
            : null;

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: AppColors.divider),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              // Star row
              Row(
                children: List.generate(
                  5,
                  (i) => Icon(
                    i < feedback.rating ? Icons.star : Icons.star_border,
                    color: AppColors.secondary,
                    size: 18,
                  ),
                ),
              ),
              const SizedBox(width: 8),
              Text(
                '${feedback.rating}/5',
                style: const TextStyle(
                  fontWeight: FontWeight.bold,
                  color: AppColors.primary,
                ),
              ),
              const Spacer(),
              if (date != null)
                Text(
                  date,
                  style: const TextStyle(
                    color: AppColors.textSecondary,
                    fontSize: 12,
                  ),
                ),
            ],
          ),
          if (feedback.comment != null && feedback.comment!.isNotEmpty) ...[
            const SizedBox(height: 8),
            Text(
              feedback.comment!,
              style: const TextStyle(fontSize: 14, height: 1.5),
            ),
          ],
        ],
      ),
    );
  }
}
