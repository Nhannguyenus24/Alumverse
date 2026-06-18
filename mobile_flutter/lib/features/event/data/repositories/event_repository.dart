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

  Future<EventSummary> getDetail(int id) async {
    final res = await _dio.get(ApiEndpoints.eventDetail(id));
    final data = res.data is Map && res.data['data'] is Map
        ? res.data['data'] as Map<String, dynamic>
        : res.data as Map<String, dynamic>;
    return EventSummary.fromJson(data);
  }

  /// {interestedCount, registeredCount}
  Future<({int interested, int registered})> getStatistics(int id) async {
    final res = await _dio.get(ApiEndpoints.eventStatistics(id));
    final data = res.data is Map && res.data['data'] is Map
        ? res.data['data'] as Map
        : res.data;
    final m = data is Map ? data : const {};
    return (
      interested: (m['interestedCount'] as num?)?.toInt() ?? 0,
      registered: ((m['registeredCount'] ?? m['joinedCount']) as num?)?.toInt() ?? 0,
    );
  }

  Future<bool> isInterested(int id) => _checkFlag(
        ApiEndpoints.eventInterestCheck(id),
        const ['isInterested', 'interested'],
      );

  Future<bool> isRegistered(int id) => _checkFlag(
        ApiEndpoints.eventCheckRegistered(id),
        const ['isRegistered', 'registered'],
      );

  Future<void> addInterest(int id) => _dio.post(ApiEndpoints.eventInterest(id));

  Future<void> removeInterest(int id) =>
      _dio.delete(ApiEndpoints.eventInterest(id));

  Future<void> register(int id) =>
      _dio.post(ApiEndpoints.eventRegister(id), data: {});

  Future<bool> _checkFlag(String path, List<String> keys) async {
    final res = await _dio.get(path);
    final data = res.data is Map && res.data['data'] != null
        ? res.data['data']
        : res.data;
    if (data is bool) return data;
    if (data is Map) {
      for (final k in keys) {
        if (data[k] is bool) return data[k] as bool;
      }
    }
    return false;
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
