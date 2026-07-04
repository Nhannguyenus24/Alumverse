import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/config/env.dart';
import '../../../../core/storage/secure_storage.dart';
import '../../data/models/organization.dart';
import '../../data/models/organization_introduction.dart';
import '../../data/models/pending_peer_verification.dart';
import '../../data/models/trusted_verifier.dart';
import '../../data/repositories/organization_repository.dart';

final organizationStateProvider =
    AsyncNotifierProvider<OrganizationNotifier, Organization?>(
      OrganizationNotifier.new,
    );

class OrganizationNotifier extends AsyncNotifier<Organization?> {
  @override
  Future<Organization?> build() async {
    final storage = ref.read(secureStorageProvider);
    // Use the saved slug, or fall back to the default tenant so the app boots
    // straight into the organization without a picker (matches the web client).
    final saved = await storage.readOrganizationSlug();
    final slug =
        (saved != null && saved.isNotEmpty)
            ? saved
            : Env.defaultOrganizationSlug;
    try {
      final org = await ref
          .read(organizationRepositoryProvider)
          .getOrganizationBySlug(slug);
      await storage.writeOrganizationSlug(slug);
      return org;
    } catch (_) {
      return null;
    }
  }

  Future<void> fetchOrganization(String slug) async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(() async {
      final org = await ref
          .read(organizationRepositoryProvider)
          .getOrganizationBySlug(slug);
      await ref.read(secureStorageProvider).writeOrganizationSlug(slug);
      return org;
    });
  }

  void reset() {
    ref.read(secureStorageProvider).writeOrganizationSlug('');
    state = const AsyncData(null);
  }
}

/// Trusted verifiers for a given organization, used by the registration page.
final trustedVerifiersProvider =
    FutureProvider.family<List<TrustedVerifier>, int>((ref, organizationId) {
      return ref
          .read(organizationRepositoryProvider)
          .getTrustedVerifiers(organizationId);
    });

/// Introduction content for a given organization (view-only screen).
final organizationIntroductionProvider =
    FutureProvider.family<OrganizationIntroduction, int>((ref, organizationId) {
      return ref
          .read(organizationRepositoryProvider)
          .getIntroduction(organizationId);
    });

/// All organizations, for the org-select dropdown. Public endpoint — works
/// before login.
final organizationListProvider = FutureProvider<List<Organization>>((ref) {
  return ref.read(organizationRepositoryProvider).getOrganizations();
});

/// Peer-verification requests the current user received, for the current org.
/// Re-watches the current organization so it scopes to the active tenant.
final pendingPeerVerificationsProvider =
    FutureProvider<List<PendingPeerVerification>>((ref) async {
      final org = ref.watch(organizationStateProvider).valueOrNull;
      if (org == null) return const [];
      return ref
          .read(organizationRepositoryProvider)
          .getPendingPeerVerifications(org.id);
    });
