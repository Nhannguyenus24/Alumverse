import 'package:flutter/material.dart';

/// Palette mirrored from the web frontend (`frontend/src/theme/palette.jsx`)
/// so mobile shares the same brand colours. Keep these in sync with that file.
class AppColors {
  AppColors._();

  // PRIMARY (#013F83) — frontend brand blue.
  static const Color primary = Color(0xFF013F83);
  static const Color primaryDark = Color(0xFF012B59);
  static const Color primaryDarker = Color(0xFF00152B);
  static const Color primaryLight = Color(0xFFCFE6FF);
  static const Color primaryLighter = Color(0xFFF1F8FF);

  // SECONDARY (#40454B).
  static const Color secondary = Color(0xFF40454B);
  static const Color secondaryDark = Color(0xFF131313);
  static const Color secondaryLight = Color(0xFF8C8C8C);
  static const Color secondaryLighter = Color(0xFFCECECE);

  static const Color info = Color(0xFF1890FF);
  static const Color success = Color(0xFF00A500);
  static const Color warning = Color(0xFFDFBA00);
  static const Color error = Color(0xFFE70000);

  // Text / surfaces — frontend GREY scale.
  static const Color textPrimary = Color(0xFF212B36); // GREY[800]
  static const Color textSecondary = Color(0xFF637381); // GREY[600]
  static const Color divider = Color(0xFFDFE3E8); // GREY[300]
  static const Color surface = Colors.white;
  static const Color background = surface;
}
