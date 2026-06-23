import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/widgets.dart';

/// Vietnamese relative time, mirroring the web `formatRelativeTimeVi`
/// (vd "vài giây trước", "5 phút trước", "3 ngày trước").
///
/// Pass an optional [context] to get a localized string via easy_localization.
/// When [context] is omitted the function falls back to Vietnamese literals so
/// it can still be called from contexts without a BuildContext (e.g. pure
/// utility code or tests).
String formatRelativeTimeVi(DateTime? time, [BuildContext? context]) {
  if (time == null) return '';
  final now = DateTime.now();
  final diff = now.difference(time);

  if (diff.isNegative) {
    return context != null ? 'common.just_now'.tr() : 'vừa xong';
  }
  if (diff.inSeconds < 60) {
    return context != null ? 'common.just_now'.tr() : 'vài giây trước';
  }
  if (diff.inMinutes < 60) {
    return context != null
        ? 'common.minutes_ago'.tr(namedArgs: {'n': '${diff.inMinutes}'})
        : '${diff.inMinutes} phút trước';
  }
  if (diff.inHours < 24) {
    return context != null
        ? 'common.hours_ago'.tr(namedArgs: {'n': '${diff.inHours}'})
        : '${diff.inHours} giờ trước';
  }
  if (diff.inDays < 30) {
    return context != null
        ? 'common.days_ago'.tr(namedArgs: {'n': '${diff.inDays}'})
        : '${diff.inDays} ngày trước';
  }
  if (diff.inDays < 365) {
    final months = (diff.inDays / 30).floor();
    return context != null
        ? 'common.months_ago'.tr(namedArgs: {'n': '$months'})
        : '$months tháng trước';
  }
  final years = (diff.inDays / 365).floor();
  return context != null
      ? 'common.years_ago'.tr(namedArgs: {'n': '$years'})
      : '$years năm trước';
}
