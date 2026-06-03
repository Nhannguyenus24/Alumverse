import 'package:flutter/material.dart';

class AlumverseLogo extends StatelessWidget {
  final double size;
  final Color? color;

  const AlumverseLogo({
    super.key,
    this.size = 120,
    this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(
          Icons.school_rounded,
          size: size,
          color: color ?? Theme.of(context).primaryColor,
        ),
        Text(
          'AlumVerse',
          style: TextStyle(
            fontSize: size / 4,
            fontWeight: FontWeight.bold,
            color: color ?? Theme.of(context).primaryColor,
            letterSpacing: 1.2,
          ),
        ),
      ],
    );
  }
}
