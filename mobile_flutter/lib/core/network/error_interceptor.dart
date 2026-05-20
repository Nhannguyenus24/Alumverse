import 'package:dio/dio.dart';

import '../errors/api_exception.dart';

class ErrorInterceptor extends Interceptor {
  @override
  void onError(DioException err, ErrorInterceptorHandler handler) {
    final statusCode = err.response?.statusCode;
    final data = err.response?.data;

    String message = err.message ?? 'Unknown error';
    if (data is Map && data['message'] is String) {
      message = data['message'] as String;
    } else if (data is Map && data['error'] is String) {
      message = data['error'] as String;
    } else if (err.type == DioExceptionType.connectionTimeout ||
        err.type == DioExceptionType.receiveTimeout) {
      message = 'Connection timeout. Vui lòng kiểm tra mạng.';
    } else if (err.type == DioExceptionType.connectionError) {
      message = 'Không kết nối được đến server.';
    }

    final apiError = ApiException(
      statusCode: statusCode,
      message: message,
      data: data,
    );

    handler.reject(
      DioException(
        requestOptions: err.requestOptions,
        response: err.response,
        type: err.type,
        error: apiError,
      ),
    );
  }
}
