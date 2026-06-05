import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/constants/api_endpoints.dart';
import '../../../../core/network/dio_client.dart';
import '../models/network_member.dart';

final networkRepositoryProvider = Provider<NetworkRepository>((ref) {
  return NetworkRepository(ref.watch(dioProvider));
});

class NetworkRepository {
  NetworkRepository(this._dio);

  final Dio _dio;

  Future<List<NetworkMember>> searchMembers({
    String? fullName,
    String? program,
    String? major,
    int page = 0,
    int size = 9,
  }) async {
    final res = await _dio.get(
      ApiEndpoints.networkMembers,
      queryParameters: {
        if (fullName != null && fullName.isNotEmpty) 'fullName': fullName,
        if (program != null && program.isNotEmpty) 'program': program,
        if (major != null && major.isNotEmpty) 'major': major,
        'page': page,
        'size': size,
      },
    );
    final data = res.data is Map ? res.data['data'] : res.data;
    final list = data is Map ? data['items'] : data;
    if (list is! List) return const [];
    return list
        .map((e) => NetworkMember.fromJson(e as Map<String, dynamic>))
        .toList();
  }
}
