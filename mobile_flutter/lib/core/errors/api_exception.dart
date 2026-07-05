class ApiException implements Exception {
  final int? statusCode;
  final String message;
  final dynamic data;

  const ApiException({this.statusCode, required this.message, this.data});

  bool get isUnauthorized => statusCode == 401;
  bool get isForbidden => statusCode == 403;
  bool get isNotFound => statusCode == 404;
  bool get isServerError => (statusCode ?? 0) >= 500;
  bool get isNetwork => statusCode == null;

  @override
  String toString() => 'ApiException($statusCode): $message';
}
