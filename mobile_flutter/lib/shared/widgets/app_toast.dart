import 'package:dio/dio.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';

import '../../core/errors/api_exception.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_spacing.dart';

enum ToastType { success, error, info, warning }

/// Top-right slide-in toast with a colour matched to the message type
/// (success=green, error=red, info=blue, warning=amber). Rendered via the
/// app Overlay so it works from anywhere — no Scaffold/SnackBar needed.
class AppToast {
  AppToast._();

  static void success(BuildContext context, String message) =>
      _show(context, message, ToastType.success);

  static void error(BuildContext context, String message) =>
      _show(context, message, ToastType.error);

  static void info(BuildContext context, String message) =>
      _show(context, message, ToastType.info);

  static void warning(BuildContext context, String message) =>
      _show(context, message, ToastType.warning);

  /// Pick colour from an HTTP status code: 2xx→success, 4xx/5xx→error,
  /// otherwise info.
  static void fromStatus(BuildContext context, int? status, String message) {
    final ToastType type;
    if (status != null && status >= 200 && status < 300) {
      type = ToastType.success;
    } else if (status != null && status >= 400) {
      type = ToastType.error;
    } else {
      type = ToastType.info;
    }
    _show(context, message, type);
  }

  /// Show an error toast from a thrown error, extracting the clean backend
  /// message (the error interceptor wraps it as [ApiException] inside a
  /// [DioException]) instead of dumping the raw exception toString().
  static void fromError(BuildContext context, Object error,
      {String? fallback}) {
    _show(context, _messageOf(error, fallback), ToastType.error);
  }

  static String _messageOf(Object error, String? fallback) {
    if (error is DioException) {
      final inner = error.error;
      if (inner is ApiException && inner.message.isNotEmpty) {
        return inner.message;
      }
    }
    if (error is ApiException && error.message.isNotEmpty) {
      return error.message;
    }
    if (error is Exception) {
      final s = error.toString().replaceFirst('Exception: ', '');
      // Avoid surfacing ugly "DioException [bad response]: null" strings.
      if (!s.startsWith('DioException')) return s;
    }
    return fallback ?? 'common.error'.tr();
  }

  static void _show(BuildContext context, String message, ToastType type) {
    final overlay = Overlay.maybeOf(context, rootOverlay: true);
    if (overlay == null) return;

    late OverlayEntry entry;
    entry = OverlayEntry(
      builder: (_) => _ToastWidget(
        message: message,
        type: type,
        onDismissed: () => entry.remove(),
      ),
    );
    overlay.insert(entry);
  }
}

class _ToastWidget extends StatefulWidget {
  const _ToastWidget({
    required this.message,
    required this.type,
    required this.onDismissed,
  });

  final String message;
  final ToastType type;
  final VoidCallback onDismissed;

  @override
  State<_ToastWidget> createState() => _ToastWidgetState();
}

class _ToastWidgetState extends State<_ToastWidget>
    with SingleTickerProviderStateMixin {
  late final AnimationController _ctl = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 280),
  );
  late final Animation<Offset> _slide = Tween<Offset>(
    begin: const Offset(1.15, 0), // off-screen to the right
    end: Offset.zero,
  ).animate(CurvedAnimation(parent: _ctl, curve: Curves.easeOutCubic));
  late final Animation<double> _fade =
      CurvedAnimation(parent: _ctl, curve: Curves.easeOut);

  bool _dismissing = false;

  @override
  void initState() {
    super.initState();
    _ctl.forward();
    // Auto-dismiss after a readable delay.
    Future.delayed(const Duration(milliseconds: 3200), _dismiss);
  }

  Future<void> _dismiss() async {
    if (_dismissing || !mounted) return;
    _dismissing = true;
    await _ctl.reverse();
    widget.onDismissed();
  }

  @override
  void dispose() {
    _ctl.dispose();
    super.dispose();
  }

  ({Color bg, Color fg, IconData icon}) get _style {
    switch (widget.type) {
      case ToastType.success:
        return (bg: AppColors.success, fg: Colors.white, icon: Icons.check_circle_rounded);
      case ToastType.error:
        return (bg: AppColors.error, fg: Colors.white, icon: Icons.error_rounded);
      case ToastType.warning:
        return (bg: AppColors.warning, fg: Colors.black87, icon: Icons.warning_rounded);
      case ToastType.info:
        return (bg: AppColors.info, fg: Colors.white, icon: Icons.info_rounded);
    }
  }

  @override
  Widget build(BuildContext context) {
    final media = MediaQuery.of(context);
    final s = _style;
    return Positioned(
      top: media.padding.top + AppSpacing.sm,
      right: AppSpacing.lg,
      left: AppSpacing.lg,
      child: Align(
        alignment: Alignment.topRight,
        child: SlideTransition(
          position: _slide,
          child: FadeTransition(
            opacity: _fade,
            child: Material(
              color: Colors.transparent,
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 420),
                child: GestureDetector(
                  onTap: _dismiss,
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: AppSpacing.md, vertical: AppSpacing.md),
                    decoration: BoxDecoration(
                      color: s.bg,
                      borderRadius: BorderRadius.circular(AppRadius.md),
                      boxShadow: const [
                        BoxShadow(
                          color: Color(0x33000000),
                          blurRadius: 12,
                          offset: Offset(0, 4),
                        ),
                      ],
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(s.icon, color: s.fg, size: 20),
                        const SizedBox(width: AppSpacing.sm),
                        Flexible(
                          child: Text(
                            widget.message,
                            style: TextStyle(
                              color: s.fg,
                              fontSize: 14,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
