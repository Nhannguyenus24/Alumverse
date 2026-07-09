import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/constants/api_endpoints.dart';
import '../../../../core/network/dio_client.dart';
import '../models/organization.dart';
import '../models/organization_introduction.dart';
import '../models/pending_peer_verification.dart';
import '../models/trusted_verifier.dart';

final organizationApiProvider = Provider<OrganizationApi>((ref) {
  return OrganizationApi(ref.watch(dioProvider));
});

class OrganizationApi {
  OrganizationApi(this._dio);

  final Dio _dio;

  Future<Organization> getOrganizationBySlug(String slug) async {
    final res = await _dio.get(ApiEndpoints.organizationBySlug(slug));
    return Organization.fromJson(_unwrap(res.data));
  }

  /// Organization introduction content (`GET /organizations/{id}/introduction`).
  Future<OrganizationIntroduction> getIntroduction(int organizationId) async {
    final res = await _dio.get(
      ApiEndpoints.organizationIntroduction(organizationId),
    );
    return OrganizationIntroduction.fromJson(_unwrap(res.data));
  }

  /// Trusted verifiers for [organizationId] — members who can vouch for an
  /// applicant during registration (`GET /organizations/{id}/trusted-verifiers`).
  Future<List<TrustedVerifier>> getTrustedVerifiers(int organizationId) async {
    final res = await _dio.get(ApiEndpoints.trustedVerifiers(organizationId));
    final body = res.data;
    final list = (body is Map ? body['data'] : body) as List? ?? const [];
    return list
        .map((e) => TrustedVerifier.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  /// Join an organization with academic info. Self-service — the current
  /// user is resolved server-side from the JWT. Mirrors the web
  /// `joinOrganization` body (`POST /users/me/organization-member`).
  Future<void> joinOrganization({
    required int organizationId,
    String? studentId,
    List<String>? startedYear,
    List<String>? program,
    List<String>? major,
    List<int>? graduatedYear,
  }) {
    return _dio.post(
      ApiEndpoints.meOrganizationMember,
      data: {
        'organizationId': organizationId,
        if (studentId != null) 'studentId': studentId,
        'startedYear': startedYear,
        'graduatedYear': graduatedYear,
        'program': program,
        'major': major,
      },
    );
  }

  /// Ask a trusted verifier to vouch for the current user
  /// (`POST /users/me/peer-verifications/request`).
  Future<void> requestPeerVerification({
    required int organizationId,
    required int verifierUserId,
  }) {
    return _dio.post(
      ApiEndpoints.peerVerificationRequest,
      data: {
        'organizationId': organizationId,
        'verifierUserId': verifierUserId,
      },
    );
  }

  /// Peer-verification requests the current user RECEIVED (pending), scoped to
  /// [organizationId] (`GET /users/me/peer-verifications/pending`).
  Future<List<PendingPeerVerification>> getPendingPeerVerifications(
    int organizationId,
  ) async {
    final res = await _dio.get(
      ApiEndpoints.peerVerificationPending,
      queryParameters: {'organizationId': organizationId},
    );
    final body = res.data;
    final list = (body is Map ? body['data'] : body) as List? ?? const [];
    return list
        .map((e) => PendingPeerVerification.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  /// Accept (vouch for) a received peer-verification request
  /// (`PATCH /users/me/peer-verifications/{requestId}/accept`).
  Future<void> acceptPeerVerification(int requestId) {
    return _dio.patch(ApiEndpoints.peerVerificationAccept('$requestId'));
  }

  /// Upload a proof document for admin verification
  /// (`POST /users/me/verification-requests`).
  Future<void> createVerificationRequest({
    required int organizationId,
    required String base64File,
    required String originalFileName,
    required String documentType,
  }) {
    return _dio.post(
      ApiEndpoints.meVerificationRequests,
      data: {
        'organizationId': organizationId,
        'base64File': base64File,
        'originalFileName': originalFileName,
        'documentType': documentType,
      },
    );
  }

  /// All active organizations.
  Future<List<Organization>> getOrganizations() async {
    final res = await _dio.get(ApiEndpoints.organizations);
    final body = res.data;
    final list = (body is Map ? body['data'] : body) as List? ?? const [];
    return list
        .map((e) => Organization.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  /// Unwrap the `ApiResponse { message, data }` envelope.
  Map<String, dynamic> _unwrap(dynamic body) {
    if (body is Map && body['data'] is Map) {
      return body['data'] as Map<String, dynamic>;
    }
    return body as Map<String, dynamic>;
  }
}
