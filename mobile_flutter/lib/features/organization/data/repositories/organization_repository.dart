import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../datasources/organization_api.dart';
import '../models/organization.dart';

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
}
