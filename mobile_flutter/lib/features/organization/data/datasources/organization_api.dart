import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/constants/api_endpoints.dart';
import '../../../../core/network/dio_client.dart';
import '../models/organization.dart';

final organizationApiProvider = Provider<OrganizationApi>((ref) {
  return OrganizationApi(ref.watch(dioProvider));
});

class OrganizationApi {
  OrganizationApi(this._dio);

  final Dio _dio;

  Future<Organization> getOrganizationBySlug(String slug) async {
    final res = await _dio.get(ApiEndpoints.organizationBySlug(slug));
    return Organization.fromJson(res.data as Map<String, dynamic>);
  }
}
