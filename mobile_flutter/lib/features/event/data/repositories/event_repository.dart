import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/constants/api_endpoints.dart';
import '../../../../core/network/dio_client.dart';
import '../models/event_summary.dart';

final eventRepositoryProvider = Provider<EventRepository>((ref) {
  return EventRepository(ref.watch(dioProvider));
});

class EventRepository {
  EventRepository(this._dio);

  final Dio _dio;

  Future<List<EventSummary>> getUpcoming({int page = 0, int limit = 10}) async {
    final res = await _dio.get(
      ApiEndpoints.eventsUpcoming,
      queryParameters: {'page': page, 'limit': limit},
    );
    return _items(res.data);
  }

  Future<List<EventSummary>> getPast({int page = 0, int limit = 10}) async {
    final res = await _dio.get(
      ApiEndpoints.eventsPast,
      queryParameters: {'page': page, 'limit': limit},
    );
    return _items(res.data);
  }

  /// Unwrap `ApiResponse.data` → PaginatedResponse → its item list. The list
  /// key varies (`items`/`content`/`data`), so probe the common ones.
  List<EventSummary> _items(dynamic body) {
    final data = body is Map ? body['data'] : body;
    final list = data is Map
        ? (data['items'] ?? data['content'] ?? data['data'])
        : data;
    if (list is! List) return const [];
    return list
        .map((e) => EventSummary.fromJson(e as Map<String, dynamic>))
        .toList();
  }
}
