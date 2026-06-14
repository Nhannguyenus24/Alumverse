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
    return Organization.fromJson(_unwrap(res.data));
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
