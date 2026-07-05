import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';

/// Opens [content] as a dropdown anchored under [anchorContext]'s widget, with a
/// small caret (mũi tên) pointing up at the source icon. Dismisses on tapping
/// the scrim or calling the provided `close` callback. Returns the value the
/// content pops with (via Navigator.pop), or null.
///
/// Use this instead of [PopupMenuButton]/[showMenu] when the dropdown should
/// visibly originate from its trigger icon and sit a touch below it.
Future<T?> showAnchoredDropdown<T>({
  required BuildContext anchorContext,
  required double width,
  required Widget Function(BuildContext context, VoidCallback close) builder,
  double gap = 8,
}) {
  final box = anchorContext.findRenderObject() as RenderBox?;
  final overlay =
      Overlay.of(anchorContext).context.findRenderObject() as RenderBox?;
  if (box == null || overlay == null) return Future.value(null);

  final size = overlay.size;
  // Anchor icon centre (x) and bottom (y) in overlay coordinates.
  final iconBottomCenter = box.localToGlobal(
    box.size.bottomCenter(Offset.zero),
    ancestor: overlay,
  );

  // Clamp the card horizontally inside the screen with an 8px margin.
  const margin = 8.0;
  double left = iconBottomCenter.dx - width / 2;
  left = left.clamp(margin, size.width - width - margin);
  final top = iconBottomCenter.dy + gap;
  // Caret x relative to the card's left edge — keeps it under the icon even
  // after clamping.
  final caretDx = (iconBottomCenter.dx - left).clamp(16.0, width - 16.0);

  return Navigator.of(anchorContext).push<T>(
    _DropdownRoute<T>(
      width: width,
      left: left,
      top: top,
      caretDx: caretDx,
      builder: builder,
    ),
  );
}

class _DropdownRoute<T> extends PopupRoute<T> {
  _DropdownRoute({
    required this.width,
    required this.left,
    required this.top,
    required this.caretDx,
    required this.builder,
  });

  final double width;
  final double left;
  final double top;
  final double caretDx;
  final Widget Function(BuildContext context, VoidCallback close) builder;

  @override
  Color? get barrierColor => Colors.black.withValues(alpha: 0.08);

  @override
  bool get barrierDismissible => true;

  @override
  String? get barrierLabel => 'Dismiss';

  @override
  Duration get transitionDuration => const Duration(milliseconds: 150);

  @override
  Widget buildPage(
    BuildContext context,
    Animation<double> animation,
    Animation<double> secondaryAnimation,
  ) {
    return Stack(
      children: [
        Positioned(
          left: left,
          top: top,
          width: width,
          child: _DropdownCard(
            caretDx: caretDx,
            child: Builder(
              builder: (ctx) => builder(ctx, () => Navigator.of(ctx).pop()),
            ),
          ),
        ),
      ],
    );
  }

  @override
  Widget buildTransitions(
    BuildContext context,
    Animation<double> animation,
    Animation<double> secondaryAnimation,
    Widget child,
  ) {
    final curved = CurvedAnimation(parent: animation, curve: Curves.easeOut);
    return FadeTransition(
      opacity: curved,
      child: Align(
        alignment: Alignment.topCenter,
        child: SizeTransition(
          sizeFactor: curved,
          axisAlignment: -1,
          child: child,
        ),
      ),
    );
  }
}

/// Rounded card with a caret pointing up at [caretDx] from its left edge.
class _DropdownCard extends StatelessWidget {
  const _DropdownCard({required this.child, required this.caretDx});

  final Widget child;
  final double caretDx;

  static const double _caretH = 8;
  static const double _caretW = 16;

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Caret (mũi tên) pointing up at the source icon.
        Padding(
          padding: EdgeInsets.only(left: caretDx - _caretW / 2),
          child: CustomPaint(
            size: const Size(_caretW, _caretH),
            painter: _CaretPainter(AppColors.surface),
          ),
        ),
        Material(
          color: AppColors.surface,
          elevation: 8,
          borderRadius: BorderRadius.circular(12),
          clipBehavior: Clip.antiAlias,
          child: child,
        ),
      ],
    );
  }
}

class _CaretPainter extends CustomPainter {
  _CaretPainter(this.color);
  final Color color;

  @override
  void paint(Canvas canvas, Size size) {
    final paint =
        Paint()
          ..color = color
          ..style = PaintingStyle.fill;
    final path =
        Path()
          ..moveTo(0, size.height)
          ..lineTo(size.width / 2, 0)
          ..lineTo(size.width, size.height)
          ..close();
    // Soft shadow so the caret blends with the card's elevation.
    canvas.drawShadow(path, Colors.black, 3, false);
    canvas.drawPath(path, paint);
  }

  @override
  bool shouldRepaint(_CaretPainter old) => old.color != color;
}
