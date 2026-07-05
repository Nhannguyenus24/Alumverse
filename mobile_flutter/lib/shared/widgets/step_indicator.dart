import 'package:flutter/material.dart';

/// Horizontal step progress indicator with numbered circles and connecting lines.
/// Example: StepIndicator(current: 1, total: 2)
class StepIndicator extends StatelessWidget {
  const StepIndicator({super.key, required this.current, required this.total});

  final int current;
  final int total;

  @override
  Widget build(BuildContext context) {
    final primary = Theme.of(context).primaryColor;
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        for (int i = 1; i <= total; i++) ...[
          if (i > 1)
            Container(
              width: 32,
              height: 2,
              color: i <= current ? primary : primary.withValues(alpha: 0.2),
            ),
          Container(
            width: 28,
            height: 28,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: i <= current ? primary : Colors.transparent,
              border: Border.all(
                color: i <= current ? primary : primary.withValues(alpha: 0.3),
                width: 2,
              ),
            ),
            child: Center(
              child: Text(
                '$i',
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.bold,
                  color:
                      i <= current
                          ? Colors.white
                          : primary.withValues(alpha: 0.4),
                ),
              ),
            ),
          ),
        ],
      ],
    );
  }
}
