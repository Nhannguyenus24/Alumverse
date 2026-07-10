import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/constants/api_endpoints.dart';
import '../../../../core/network/dio_client.dart';
import '../models/mentee_profile.dart';
import '../models/mentor_availability.dart';
import '../models/mentor_profile.dart';
import '../models/mentorship_session.dart';
import '../models/session_feedback.dart';
import '../models/skill.dart';

final mentorshipRepositoryProvider = Provider<MentorshipRepository>((ref) {
  return MentorshipRepository(ref.watch(dioProvider));
});

/// Mentee-side mentorship API. Mirrors the web `useBrowseMentors` routing:
/// keyword-only → /search, any advanced filter → /filter, else → approved list.
class MentorshipRepository {
  MentorshipRepository(this._dio);

  final Dio _dio;

  Future<List<MentorProfile>> browseMentors({
    String keyword = '',
    List<int> skillIds = const [],
    int page = 0,
    int limit = 10,
  }) async {
    final hasAdvanced = skillIds.isNotEmpty;
    final kw = keyword.trim();

    final Response res;
    if (hasAdvanced) {
      res = await _dio.get(
        ApiEndpoints.menteeMentorFilter,
        queryParameters: {
          if (kw.isNotEmpty) 'search': kw,
          'skillIds': skillIds,
          'page': page,
          'limit': limit,
        },
        // Repeat array keys without brackets (skillIds=1&skillIds=2) so Spring
        // binds them to List<Integer>; dio defaults to skillIds[]=1.
        options: Options(listFormat: ListFormat.multiCompatible),
      );
    } else if (kw.isNotEmpty) {
      res = await _dio.get(
        ApiEndpoints.menteeMentorSearch,
        queryParameters: {'keyword': kw, 'page': page, 'limit': limit},
      );
    } else {
      res = await _dio.get(
        ApiEndpoints.menteeMentors,
        queryParameters: {'page': page, 'limit': limit},
      );
    }
    return _items(res.data, MentorProfile.fromJson);
  }

  Future<MentorProfile> getMentorProfile(int memberId) async {
    final res = await _dio.get(ApiEndpoints.menteeMentorProfile(memberId));
    return MentorProfile.fromJson(_dataMap(res.data));
  }

  Future<List<MentorAvailability>> getMentorAvailability(int memberId) async {
    final res = await _dio.get(ApiEndpoints.menteeMentorAvailability(memberId));
    return _dataList(res.data)
        .map((e) => MentorAvailability.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  /// Skill catalog lookup for the "filter by skill" multi-select: %LIKE%
  /// search over existing skills (skills table), sorted A-Z by the backend.
  Future<List<Skill>> searchSkills({String search = '', int limit = 20}) async {
    final res = await _dio.get(
      ApiEndpoints.menteeSkills,
      queryParameters: {
        if (search.trim().isNotEmpty) 'search': search.trim(),
        'page': 0,
        'limit': limit,
      },
    );
    return _items(res.data, Skill.fromJson);
  }

  Future<MentorshipSession> bookSession({
    required int availabilityId,
    required String sessionType,
    required String introduction,
    String? description,
    String? bookingNote,
  }) async {
    final res = await _dio.post(
      ApiEndpoints.menteeBookSession,
      data: {
        'availabilityId': availabilityId,
        'sessionType': sessionType,
        'introduction': introduction,
        if (description != null && description.isNotEmpty)
          'description': description,
        if (bookingNote != null && bookingNote.isNotEmpty)
          'bookingNote': bookingNote,
      },
    );
    return MentorshipSession.fromJson(_dataMap(res.data));
  }

  Future<List<MentorshipSession>> getMySessions({
    int page = 0,
    int limit = 20,
  }) async {
    final res = await _dio.get(
      ApiEndpoints.menteeSessions,
      queryParameters: {'page': page, 'limit': limit},
    );
    return _items(res.data, MentorshipSession.fromJson);
  }

  /// Submit a rating+comment after a COMPLETED session.
  Future<SessionFeedback> submitFeedback({
    required int sessionId,
    required int rating,
    String? comment,
    bool isPublic = true,
  }) async {
    final res = await _dio.post(
      ApiEndpoints.menteeSessionFeedback(sessionId),
      data: {
        'rating': rating,
        if (comment != null && comment.isNotEmpty) 'comment': comment,
        'isPublic': isPublic,
      },
    );
    return SessionFeedback.fromJson(_dataMap(res.data));
  }

  /// Public feedback list for a mentor profile (paginated).
  Future<List<SessionFeedback>> getMentorFeedbacks(
    int memberId, {
    int page = 0,
    int limit = 10,
  }) async {
    final res = await _dio.get(
      ApiEndpoints.menteeMentorFeedbacks(memberId),
      queryParameters: {'page': page, 'limit': limit},
    );
    return _items(res.data, SessionFeedback.fromJson);
  }

  Future<MentorshipSession> getMenteeSessionById(int sessionId) async {
    final res = await _dio.get(ApiEndpoints.menteeSessionDetail(sessionId));
    return MentorshipSession.fromJson(_dataMap(res.data));
  }

  Future<MentorshipSession> cancelSession(int sessionId) async {
    final res = await _dio.post(ApiEndpoints.menteeSessionCancel(sessionId));
    return MentorshipSession.fromJson(_dataMap(res.data));
  }

  Future<MenteeProfile?> getMyMenteeProfile() async {
    try {
      final res = await _dio.get(ApiEndpoints.menteeProfile);
      final data = _dataMap(res.data);
      if (data.isEmpty) return null;
      return MenteeProfile.fromJson(data);
    } on DioException {
      return null;
    }
  }

  Future<MenteeProfile> createOrUpdateMenteeProfile({
    required String mentoringGoal,
    required String major,
    required String academicYear,
    String? interests,
    bool termsAccepted = true,
  }) async {
    final res = await _dio.post(
      ApiEndpoints.menteeProfile,
      data: {
        'mentoringGoal': mentoringGoal,
        'major': major,
        'academicYear': academicYear,
        if (interests != null && interests.isNotEmpty) 'interests': interests,
        'termsAccepted': termsAccepted,
      },
    );
    return MenteeProfile.fromJson(_dataMap(res.data));
  }

  // --- Mentor side ---

  /// The current user's mentor profile, or null if they aren't a mentor yet
  /// (backend returns an error/empty in that case).
  Future<MentorProfile?> getMyMentorProfile() async {
    try {
      final res = await _dio.get(ApiEndpoints.mentorProfile);
      final data = _dataMap(res.data);
      if (data.isEmpty) return null;
      return MentorProfile.fromJson(data);
    } on DioException {
      return null;
    }
  }

  /// Create the mentor profile (signup). Returns the created profile.
  /// [extendedProfile] is a JSON-encoded string of
  /// {educations, experiences, projects, awards, skills} — mirrors the web
  /// signup form's extendedProfile payload.
  Future<MentorProfile> createMentorProfile({
    required String currentJobTitle,
    required String currentCompany,
    String? defaultMeetingLink,
    String? extendedProfile,
    List<String> expertiseTags = const [],
  }) async {
    final res = await _dio.post(
      ApiEndpoints.mentorProfile,
      data: {
        'currentJobTitle': currentJobTitle,
        'currentCompany': currentCompany,
        if (defaultMeetingLink != null && defaultMeetingLink.isNotEmpty)
          'defaultMeetingLink': defaultMeetingLink,
        if (extendedProfile != null) 'extendedProfile': extendedProfile,
        'expertiseTags': expertiseTags,
      },
    );
    return MentorProfile.fromJson(_dataMap(res.data));
  }

  /// Save an incomplete mentor profile as DRAFT. Mirrors the web save-draft
  /// flow so a draft created on web can be continued on mobile and vice versa.
  Future<MentorProfile> saveMentorProfileDraft({
    String? currentJobTitle,
    String? currentCompany,
    String? defaultMeetingLink,
    String? extendedProfile,
    List<String> expertiseTags = const [],
  }) async {
    final res = await _dio.post(
      ApiEndpoints.mentorProfileDraft,
      data: {
        if (currentJobTitle != null && currentJobTitle.isNotEmpty)
          'currentJobTitle': currentJobTitle,
        if (currentCompany != null && currentCompany.isNotEmpty)
          'currentCompany': currentCompany,
        if (defaultMeetingLink != null && defaultMeetingLink.isNotEmpty)
          'defaultMeetingLink': defaultMeetingLink,
        if (extendedProfile != null) 'extendedProfile': extendedProfile,
        'expertiseTags': expertiseTags,
      },
    );
    return MentorProfile.fromJson(_dataMap(res.data));
  }

  /// Uploads a mentor's CV (PDF only) and returns the AI-extracted profile
  /// fields (job title/company/bio/education/experience/...) as a raw map, to
  /// auto-fill the signup form. Mirrors POST /api/mentorship/cv/extract.
  Future<Map<String, dynamic>> extractCv({
    required String base64File,
    required String originalFileName,
  }) async {
    final res = await _dio.post(
      ApiEndpoints.mentorshipCvExtract,
      data: {'base64File': base64File, 'originalFileName': originalFileName},
    );
    return _dataMap(res.data);
  }

  /// ME-02: extracts skill/expertise tags from a free-text description of
  /// the mentor's experience. Mirrors POST /api/mentorship/skills/extract.
  Future<List<String>> extractSkillTags(String text) async {
    final res = await _dio.post(
      ApiEndpoints.mentorshipSkillsExtract,
      data: {'text': text},
    );
    final data = _dataMap(res.data);
    final tags = data['tags'];
    return tags is List ? tags.whereType<String>().toList() : const [];
  }

  // ── Mentor: sessions & status ─────────────────────────────────

  Future<List<MentorshipSession>> getMentorSessions({
    int page = 0,
    int limit = 50,
  }) async {
    final res = await _dio.get(
      ApiEndpoints.mentorSessions,
      queryParameters: {'page': page, 'limit': limit},
    );
    return _items(res.data, MentorshipSession.fromJson);
  }

  /// Accept or reject a session (CONFIRMED / REJECTED).
  /// Pass [meetingLink] when confirming to set the meeting URL.
  Future<MentorshipSession> updateSessionStatus(
    int sessionId, {
    required String status,
    String? meetingLink,
  }) async {
    final res = await _dio.put(
      ApiEndpoints.mentorSessionStatus(sessionId),
      data: {
        'status': status,
        if (meetingLink != null && meetingLink.isNotEmpty)
          'meetingLink': meetingLink,
      },
    );
    return MentorshipSession.fromJson(_dataMap(res.data));
  }

  // ── Mentor: availability ──────────────────────────────────────

  Future<List<MentorAvailability>> getMyAvailability() async {
    final res = await _dio.get(ApiEndpoints.mentorAvailability);
    return _dataList(res.data)
        .map((e) => MentorAvailability.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<MentorAvailability> addAvailability({
    required DateTime startTime,
    required DateTime endTime,
  }) async {
    final res = await _dio.post(
      ApiEndpoints.mentorAvailability,
      data: {
        'startTime': startTime.toIso8601String(),
        'endTime': endTime.toIso8601String(),
      },
    );
    return MentorAvailability.fromJson(_dataMap(res.data));
  }

  Future<void> deleteAvailability(int id) =>
      _dio.delete(ApiEndpoints.mentorAvailabilityDelete(id));

  // ── Mentor: feedbacks received ────────────────────────────────

  Future<List<SessionFeedback>> getMyMentorFeedbacks({
    int page = 0,
    int limit = 20,
  }) async {
    final res = await _dio.get(
      ApiEndpoints.mentorFeedbacks,
      queryParameters: {'page': page, 'limit': limit},
    );
    return _items(res.data, SessionFeedback.fromJson);
  }

  /// Add one expertise entry to the current mentor.
  Future<void> addExpertise({
    required String topic,
    required String category,
    int? yearsExperience,
    String? description,
  }) async {
    await _dio.post(
      ApiEndpoints.mentorExpertise,
      data: {
        'topic': topic,
        'category': category,
        if (yearsExperience != null) 'yearsExperience': yearsExperience,
        if (description != null && description.isNotEmpty)
          'description': description,
      },
    );
  }

  // --- helpers ---

  /// Unwrap `ApiResponse.data` as a map.
  Map<String, dynamic> _dataMap(dynamic body) {
    final data = body is Map ? body['data'] : body;
    return data is Map<String, dynamic> ? data : <String, dynamic>{};
  }

  /// Unwrap `ApiResponse.data` as a list.
  List _dataList(dynamic body) {
    final data = body is Map ? body['data'] : body;
    return data is List ? data : const [];
  }

  /// Unwrap `ApiResponse.data.items` (PaginatedResponse) → mapped list.
  List<T> _items<T>(dynamic body, T Function(Map<String, dynamic>) fromJson) {
    final data = body is Map ? body['data'] : body;
    final items = data is Map ? data['items'] : data;
    if (items is! List) return const [];
    return items.map((e) => fromJson(e as Map<String, dynamic>)).toList();
  }
}
