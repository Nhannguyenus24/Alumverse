import 'package:dio/dio.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/constants/api_endpoints.dart';
import '../../../../core/errors/api_exception.dart';
import '../../../../core/network/dio_client.dart';
import '../models/event_question.dart';
import '../models/event_summary.dart';
import '../models/event_ticket.dart';

final eventRepositoryProvider = Provider<EventRepository>((ref) {
  return EventRepository(ref.watch(dioProvider));
});

class EventRepository {
  EventRepository(this._dio);

  final Dio _dio;

  Future<List<EventSummary>> getUpcoming({
    int page = 0,
    int limit = 10,
    int? organizationId,
  }) async {
    final res = await _dio.get(
      ApiEndpoints.eventsUpcoming,
      queryParameters: {
        'page': page,
        'limit': limit,
        if (organizationId != null) 'organizationId': organizationId,
      },
    );
    return _items(res.data);
  }

  Future<List<EventSummary>> getPast({
    int page = 0,
    int limit = 10,
    int? organizationId,
  }) async {
    final res = await _dio.get(
      ApiEndpoints.eventsPast,
      queryParameters: {
        'page': page,
        'limit': limit,
        if (organizationId != null) 'organizationId': organizationId,
      },
    );
    return _items(res.data);
  }

  Future<EventSummary> getDetail(int id) async {
    final res = await _dio.get(ApiEndpoints.eventDetail(id));
    final data =
        res.data is Map && res.data['data'] is Map
            ? res.data['data'] as Map<String, dynamic>
            : res.data as Map<String, dynamic>;
    return EventSummary.fromJson(data);
  }

  /// {interestedCount, registeredCount}
  Future<({int interested, int registered})> getStatistics(int id) async {
    final res = await _dio.get(ApiEndpoints.eventStatistics(id));
    final data =
        res.data is Map && res.data['data'] is Map
            ? res.data['data'] as Map
            : res.data;
    final m = data is Map ? data : const {};
    return (
      interested: (m['interestedCount'] as num?)?.toInt() ?? 0,
      registered:
          ((m['registeredCount'] ?? m['joinedCount']) as num?)?.toInt() ?? 0,
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

  /// Registration questions for an event (empty list if none).
  Future<List<EventQuestion>> getQuestions(int id) async {
    final res = await _dio.get(ApiEndpoints.eventQuestions(id));
    final data = res.data is Map ? res.data['data'] : res.data;
    if (data is! List) return const [];
    return data
        .map((e) => EventQuestion.fromJson(e as Map<String, dynamic>))
        .toList()
      ..sort((a, b) => a.orderIndex.compareTo(b.orderIndex));
  }

  /// Register for an event. [answers] is a list of {questionId, value} where
  /// value is a String (text/single choice) or `List<String>` (multi choice).
  Future<void> register(int id, {List<Map<String, dynamic>>? answers}) =>
      _dio.post(
        ApiEndpoints.eventRegister(id),
        data: {if (answers != null && answers.isNotEmpty) 'answers': answers},
      );

  /// The current user's registration tickets (`GET /api/events/my-tickets`).
  Future<List<EventTicket>> getMyTickets({int page = 0, int limit = 50}) async {
    final res = await _dio.get(
      ApiEndpoints.eventMyTickets,
      queryParameters: {'page': page, 'limit': limit},
    );
    final data = res.data is Map ? res.data['data'] : res.data;
    final list =
        data is Map ? (data['items'] ?? data['content'] ?? data['data']) : data;
    if (list is! List) return const [];
    return list
        .whereType<Map>()
        .map((e) => EventTicket.fromJson(e.cast<String, dynamic>()))
        .toList();
  }

  /// A single ticket by its code (`GET /api/events/tickets/code/{code}`).
  Future<EventTicket> getTicketByCode(String code) async {
    final res = await _dio.get(ApiEndpoints.eventTicketByCode(code));
    final data =
        res.data is Map && res.data['data'] is Map
            ? res.data['data'] as Map<String, dynamic>
            : res.data as Map<String, dynamic>;
    return EventTicket.fromJson(data);
  }

  Future<void> cancelTicketByCode(String code, String reason) async {
    await _dio.post(
      ApiEndpoints.eventCancelTicket(code),
      data: {'reason': reason},
    );
  }

  /// Admin/staff check-in for [eventId]. Provide either the scanned encrypted
  /// [qrToken] (preferred) or the raw ticket [code] (manual fallback).
  /// (`POST /api/events/{eventId}/tickets/check-in`). The backend decrypts/verifies
  /// the token, enforces the event scope + status, and returns the updated ticket
  /// enriched with the holder's profile so staff can verify the person. Rejected
  /// tickets surface via [ApiException.message].
  Future<EventTicket> checkIn(
    int eventId, {
    String? qrToken,
    String? code,
  }) async {
    final res = await _dio.post(
      ApiEndpoints.eventCheckIn(eventId),
      data: {'qrToken': qrToken, 'code': code},
    );
    final data =
        res.data is Map && res.data['data'] is Map
            ? res.data['data'] as Map<String, dynamic>
            : res.data as Map<String, dynamic>;
    return EventTicket.fromJson(data);
  }

  /// Full statistics for one event (admin): registered, checked-in, interested,
  /// capacity, available slots (`GET /api/events/{id}/statistics`).
  Future<Map<String, dynamic>> getEventStatistics(int id) async {
    final res = await _dio.get(ApiEndpoints.eventStatistics(id));
    final data =
        res.data is Map && res.data['data'] is Map
            ? res.data['data'] as Map<String, dynamic>
            : (res.data is Map
                ? res.data as Map<String, dynamic>
                : <String, dynamic>{});
    return data;
  }

  /// Admin ticket list for an event (`GET /api/admin/events/{id}/tickets`).
  Future<Map<String, dynamic>> getAdminEventTickets(
    int eventId, {
    int page = 0,
    int limit = 20,
    String? keyword,
    String? status,
  }) async {
    final res = await _dio.get(
      ApiEndpoints.adminEventTickets(eventId),
      queryParameters: {
        'page': page,
        'limit': limit,
        if (keyword != null && keyword.isNotEmpty) 'keyword': keyword,
        if (status != null && status.isNotEmpty) 'status': status,
      },
    );
    final data = res.data is Map ? res.data['data'] : res.data;
    return data is Map ? data.cast<String, dynamic>() : <String, dynamic>{};
  }

  /// Admin interest list for an event (`GET /api/admin/events/{id}/interests`).
  Future<Map<String, dynamic>> getAdminEventInterests(
    int eventId, {
    int page = 0,
    int limit = 20,
  }) async {
    final res = await _dio.get(
      ApiEndpoints.adminEventInterests(eventId),
      queryParameters: {'page': page, 'limit': limit},
    );
    final data = res.data is Map ? res.data['data'] : res.data;
    return data is Map ? data.cast<String, dynamic>() : <String, dynamic>{};
  }

  /// Publish an event (`POST /api/admin/events/{id}/publish`).
  Future<void> publishEvent(int id) =>
      _dio.post(ApiEndpoints.adminEventPublish(id));

  /// Unpublish an event (`POST /api/admin/events/{id}/unpublish`).
  Future<void> unpublishEvent(int id) =>
      _dio.post(ApiEndpoints.adminEventUnpublish(id));

  /// Cancel a ticket by code, admin override
  /// (`POST /api/admin/events/tickets/{code}/cancel`).
  Future<void> adminCancelTicket(String code) =>
      _dio.post(ApiEndpoints.adminEventCancelTicket(code));

  /// All events of an organization for the admin check-in picker, including
  /// drafts and past events (`GET /api/admin/events?organizationId=...`).
  /// Requires an admin/staff session. Note the admin API uses `size`, not
  /// `limit`, for the page size.
  Future<List<EventSummary>> getOrganizationEvents(
    int organizationId, {
    int page = 0,
    int size = 100,
  }) async {
    final res = await _dio.get(
      ApiEndpoints.adminEvents,
      queryParameters: {
        'organizationId': organizationId,
        'page': page,
        'size': size,
      },
    );
    return _items(res.data);
  }

  /// Cancel the current user's registration for [eventId]. Looks up the user's
  /// ticket (via /my-tickets) to find its code, then cancels with [reason].
  /// Throws if no active ticket is found.
  Future<void> cancelRegistration(int eventId, String reason) async {
    final code = await _findMyTicketCode(eventId);
    if (code == null) {
      throw ApiException(
        statusCode: 404,
        message: 'event.ticket_not_found'.tr(),
      );
    }
    await cancelTicketByCode(code, reason);
  }

  /// Find the (non-cancelled) ticket code the current user holds for [eventId].
  Future<String?> _findMyTicketCode(int eventId) async {
    final res = await _dio.get(
      ApiEndpoints.eventMyTickets,
      queryParameters: {'page': 0, 'limit': 100},
    );
    final data = res.data is Map ? res.data['data'] : res.data;
    final list =
        data is Map ? (data['items'] ?? data['content'] ?? data['data']) : data;
    if (list is! List) return null;
    for (final raw in list) {
      if (raw is! Map) continue;
      final tEventId = (raw['eventId'] as num?)?.toInt();
      final status = raw['status']?.toString().toUpperCase();
      final canCancel =
          status == 'PENDING' || status == 'ISSUED' || status == 'ACTIVE';
      if (tEventId == eventId && canCancel) {
        final code = raw['ticketCode']?.toString();
        if (code != null && code.isNotEmpty) return code;
      }
    }
    return null;
  }

  Future<bool> _checkFlag(String path, List<String> keys) async {
    final res = await _dio.get(path);
    final data =
        res.data is Map && res.data['data'] != null
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
    final list =
        data is Map ? (data['items'] ?? data['content'] ?? data['data']) : data;
    if (list is! List) return const [];
    return list
        .map((e) => EventSummary.fromJson(e as Map<String, dynamic>))
        .toList();
  }
}
