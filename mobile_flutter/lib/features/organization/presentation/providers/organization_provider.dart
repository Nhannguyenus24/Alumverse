import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/storage/secure_storage.dart';
import '../../data/models/organization.dart';
import '../../data/repositories/organization_repository.dart';

final organizationStateProvider =
    AsyncNotifierProvider<OrganizationNotifier, Organization?>(
        OrganizationNotifier.new);

class OrganizationNotifier extends AsyncNotifier<Organization?> {
  @override
  Future<Organization?> build() async {
    final storage = ref.read(secureStorageProvider);
    final slug = await storage.readOrganizationSlug();
    if (slug != null) {
      try {
        return await ref
            .read(organizationRepositoryProvider)
            .getOrganizationBySlug(slug);
      } catch (_) {
        return null;
      }
    }
    return null;
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
