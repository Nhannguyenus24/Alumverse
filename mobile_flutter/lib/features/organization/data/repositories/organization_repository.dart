import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../datasources/organization_api.dart';
import '../models/organization.dart';
import '../models/organization_introduction.dart';
import '../models/pending_peer_verification.dart';
import '../models/trusted_verifier.dart';

final organizationRepositoryProvider = Provider<OrganizationRepository>((ref) {
  return OrganizationRepository(api: ref.watch(organizationApiProvider));
});

class OrganizationRepository {
  OrganizationRepository({required this.api});

  final OrganizationApi api;

  Future<Organization> getOrganizationBySlug(String slug) async {
    return await api.getOrganizationBySlug(slug);
  }

  Future<List<Organization>> getOrganizations() => api.getOrganizations();

  Future<OrganizationIntroduction> getIntroduction(int organizationId) =>
      api.getIntroduction(organizationId);

  Future<List<TrustedVerifier>> getTrustedVerifiers(int organizationId) =>
      api.getTrustedVerifiers(organizationId);

  Future<void> joinOrganization({
    required int organizationId,
    required int userId,
    List<String>? program,
    List<String>? major,
    List<int>? graduatedYear,
  }) =>
      api.joinOrganization(
        organizationId: organizationId,
        userId: userId,
        program: program,
        major: major,
        graduatedYear: graduatedYear,
      );

  Future<void> requestPeerVerification({
    required int organizationId,
    required int verifierUserId,
  }) =>
      api.requestPeerVerification(
        organizationId: organizationId,
        verifierUserId: verifierUserId,
      );

  /// Peer-verification requests the current user received (to vouch for others).
  Future<List<PendingPeerVerification>> getPendingPeerVerifications(
          int organizationId) =>
      api.getPendingPeerVerifications(organizationId);

  /// Accept a received peer-verification request.
  Future<void> acceptPeerVerification(int requestId) =>
      api.acceptPeerVerification(requestId);

  Future<void> createVerificationRequest({
    required String base64File,
    required String originalFileName,
    required String documentType,
  }) =>
      api.createVerificationRequest(
        base64File: base64File,
        originalFileName: originalFileName,
        documentType: documentType,
      );
}
