import 'package:easy_localization/easy_localization.dart';

class Validators {
  Validators._();

  static String? required(String? value, {String field = ''}) {
    if (value == null || value.trim().isEmpty) {
      return field.isNotEmpty
          ? 'validation.field_required'.tr(namedArgs: {'field': field})
          : 'validation.required'.tr();
    }
    return null;
  }

  static String? email(String? value) {
    final v = value?.trim() ?? '';
    if (v.isEmpty) return 'validation.email_empty'.tr();
    final regex = RegExp(r'^[\w\.\-]+@([\w\-]+\.)+[\w\-]{2,}$');
    if (!regex.hasMatch(v)) return 'validation.email_invalid'.tr();
    return null;
  }

  static String? password(String? value) {
    final v = value ?? '';
    if (v.isEmpty) return 'validation.password_empty'.tr();
    if (v.length < 8) return 'validation.password_min_length'.tr();

    // Add same requirements as frontend
    if (!RegExp(r'[A-Z]').hasMatch(v)) {
      return 'validation.password_uppercase'.tr();
    }
    if (!RegExp(r'[a-z]').hasMatch(v)) {
      return 'validation.password_lowercase'.tr();
    }
    if (!RegExp(r'\d').hasMatch(v)) return 'validation.password_digit'.tr();
    if (!RegExp(r'[@$!%*?&]').hasMatch(v)) {
      return 'validation.password_special'.tr();
    }

    return null;
  }

  static String? confirmPassword(String? value, String password) {
    if (value == null || value.isEmpty) {
      return 'validation.confirm_password_empty'.tr();
    }
    if (value != password) return 'validation.password_mismatch'.tr();
    return null;
  }

  static String? studentId(String? value) {
    if (value == null || value.trim().isEmpty) {
      return 'validation.student_id_empty'.tr();
    }
    // Add specific student ID validation if needed
    return null;
  }

  /// Vietnamese mobile number: exactly 10 digits, leading 0, and a valid
  /// carrier prefix (second digit 3/5/7/8/9 — Viettel/Vina/Mobi/Vietnamobile/
  /// Gmobile under the current numbering plan). [optional] allows an empty value.
  static String? vietnamPhone(String? value, {bool optional = false}) {
    final v = value?.trim() ?? '';
    if (v.isEmpty) {
      return optional ? null : 'validation.phone_empty'.tr();
    }
    if (!RegExp(r'^\d+$').hasMatch(v)) {
      return 'validation.phone_digits_only'.tr();
    }
    if (v.length != 10) {
      return 'validation.phone_length'.tr();
    }
    if (!RegExp(r'^0[35789]\d{8}$').hasMatch(v)) {
      return 'validation.phone_invalid'.tr();
    }
    return null;
  }
}
