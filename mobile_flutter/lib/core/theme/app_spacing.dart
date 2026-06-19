/// Design tokens — consistent spacing & corner radii across the app.
/// Use these instead of ad-hoc magic numbers so screens line up to the
/// same rhythm (4/8/12/16/24/32) and corners match.
class AppSpacing {
  AppSpacing._();

  static const double xs = 4;
  static const double sm = 8;
  static const double md = 12;
  static const double lg = 16;
  static const double xl = 24;
  static const double xxl = 32;
}

class AppRadius {
  AppRadius._();

  static const double sm = 8;
  static const double md = 12;
  static const double lg = 16;
  static const double pill = 999;
}
