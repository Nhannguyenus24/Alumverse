class Env {
  static const String apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://10.0.2.2:8080',
  );

  static const String wsBaseUrl = String.fromEnvironment(
    'WS_BASE_URL',
    defaultValue: 'ws://10.0.2.2:8080',
  );

  static const String googleClientId = String.fromEnvironment(
    'GOOGLE_CLIENT_ID',
    defaultValue: '584357169064-1d0uvdlmnl7hk2n66qf37r2asekcdg7j.apps.googleusercontent.com',
  );

  static const String imageBaseUrl = String.fromEnvironment(
    'IMAGE_BASE_URL',
    defaultValue: 'http://10.0.2.2/images/',
  );

  /// Default organization slug. The web client currently runs a single tenant
  /// (`cs-hcmus`), so the mobile app boots straight into it instead of asking
  /// the user to pick one. Override at build time with --dart-define.
  static const String defaultOrganizationSlug = String.fromEnvironment(
    'DEFAULT_ORG_SLUG',
    defaultValue: 'cs-hcmus',
  );
}
