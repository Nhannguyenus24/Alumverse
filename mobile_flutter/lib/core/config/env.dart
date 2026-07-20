class Env {
  static const String apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'YOUR_API_BASE_URL',
  );

  static const String wsBaseUrl = String.fromEnvironment(
    'WS_BASE_URL',
    defaultValue: 'YOUR_WS_BASE_URL',
  );

  static const String googleClientId = String.fromEnvironment(
    'GOOGLE_CLIENT_ID',
    defaultValue:
        'YOUR_GOOGLE_CLIENT_ID',
  );

  static const String imageBaseUrl = String.fromEnvironment(
    'IMAGE_BASE_URL',
    defaultValue: 'YOUR_IMAGE_BASE_URL',
  );

  /// Default organization slug. The web client currently runs a single tenant
  /// (`cs-hcmus`), so the mobile app boots straight into it instead of asking
  /// the user to pick one. Override at build time with --dart-define.
  static const String defaultOrganizationSlug = String.fromEnvironment(
    'DEFAULT_ORG_SLUG',
    defaultValue: 'cs-hcmus',
  );
}
