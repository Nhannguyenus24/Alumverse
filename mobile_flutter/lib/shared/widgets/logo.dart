import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';

class AlumverseLogo extends StatelessWidget {
  static const mainMark = 'assets/images/alumverse_logo/Logo_Main.svg';
  static const whiteMark = 'assets/images/alumverse_logo/Logo_White.svg';
  static const blackMark = 'assets/images/alumverse_logo/Logo_Black.svg';
  static const mainFull = 'assets/images/alumverse_logo/Logo_Main_Full.svg';
  static const whiteFull = 'assets/images/alumverse_logo/Logo_White_Full.svg';

  final double size;
  final bool full;
  final bool white;
  final bool black;
  final String semanticLabel;

  const AlumverseLogo({
    super.key,
    this.size = 120,
    this.full = true,
    this.white = false,
    this.black = false,
    this.semanticLabel = 'AlumVerse Logo',
  });

  String get _asset {
    if (full) return white ? whiteFull : mainFull;
    if (white) return whiteMark;
    if (black) return blackMark;
    return mainMark;
  }

  @override
  Widget build(BuildContext context) {
    return SvgPicture.asset(
      _asset,
      height: size,
      fit: BoxFit.contain,
      semanticsLabel: semanticLabel,
    );
  }
}
