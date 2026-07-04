import 'package:flutter/material.dart';

import '../../../../core/theme/app_colors.dart';

/// Centered section heading used across the home feed (mirrors the web's
/// uppercase primary-colored section titles).
class SectionTitle extends StatelessWidget {
  const SectionTitle(this.text, {super.key, this.action});

  final String text;
  final Widget? action;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 24, 16, 12),
      child: Row(
        children: [
          Expanded(
            child: Text(
              text.toUpperCase(),
              style: const TextStyle(
                color: AppColors.primary,
                fontSize: 20,
                fontWeight: FontWeight.w900,
                letterSpacing: 0.2,
              ),
            ),
          ),
          if (action != null) action!,
        ],
      ),
    );
  }
}
