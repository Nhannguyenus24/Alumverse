import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../data/models/blocked_member.dart';
import '../../data/models/connection.dart';
import '../../data/models/conversation_request.dart';
import '../../data/models/network_member.dart';
import '../../data/repositories/network_repository.dart';

// ── Home section provider (unchanged) ────────────────────────────────────────

/// A small sample of organization members for the home "Cộng đồng" section.
final featuredMembersProvider = FutureProvider<List<NetworkMember>>((ref) async {
  return ref.watch(networkRepositoryProvider).searchMembers(page: 0, size: 6);
});

// ── Tab 1: Member search ──────────────────────────────────────────────────────

class NetworkSearchQuery {
  final String fullName;
  final String program;
  final String major;
  final List<int> organizationIds;
  final int page;

  const NetworkSearchQuery({
    this.fullName = '',
    this.program = '',
    this.major = '',
    this.organizationIds = const [],
    this.page = 0,
  });

  NetworkSearchQuery copyWith({
    String? fullName,
    String? program,
    String? major,
    List<int>? organizationIds,
    int? page,
  }) {
    return NetworkSearchQuery(
      fullName: fullName ?? this.fullName,
      program: program ?? this.program,
      major: major ?? this.major,
      organizationIds: organizationIds ?? this.organizationIds,
      page: page ?? this.page,
    );
  }

  NetworkSearchQuery resetPage() => copyWith(page: 0);
}

final networkSearchQueryProvider =
    StateProvider<NetworkSearchQuery>((ref) => const NetworkSearchQuery());

final networkSearchProvider =
    FutureProvider<NetworkPageResult<NetworkMember>>((ref) {
  final q = ref.watch(networkSearchQueryProvider);
  return ref.watch(networkRepositoryProvider).searchMembersPaged(
        fullName: q.fullName,
        program: q.program,
        major: q.major,
        organizationIds: q.organizationIds,
        page: q.page,
        size: 10,
      );
});

// ── Tab 2: Incoming requests ──────────────────────────────────────────────────

class NetworkRequestsQuery {
  final String fullName;
  final String? status; // null = all, 'PENDING', 'REJECTED'
  final int page;

  const NetworkRequestsQuery({
    this.fullName = '',
    this.status,
    this.page = 0,
  });

  NetworkRequestsQuery copyWith({
    String? fullName,
    String? status,
    int? page,
    bool clearStatus = false,
  }) {
    return NetworkRequestsQuery(
      fullName: fullName ?? this.fullName,
      status: clearStatus ? null : (status ?? this.status),
      page: page ?? this.page,
    );
  }

  NetworkRequestsQuery resetPage() => copyWith(page: 0);
}

final networkRequestsQueryProvider =
    StateProvider<NetworkRequestsQuery>((ref) => const NetworkRequestsQuery());

final networkRequestsProvider =
    FutureProvider<NetworkPageResult<ConversationRequest>>((ref) {
  final q = ref.watch(networkRequestsQueryProvider);
  return ref.watch(networkRepositoryProvider).searchIncomingRequests(
        fullName: q.fullName,
        status: q.status,
        page: q.page,
        size: 10,
      );
});

// ── Tab 3: Connections ────────────────────────────────────────────────────────

class NetworkConnectionsQuery {
  final String fullName;
  final int page;

  const NetworkConnectionsQuery({this.fullName = '', this.page = 0});

  NetworkConnectionsQuery copyWith({String? fullName, int? page}) {
    return NetworkConnectionsQuery(
      fullName: fullName ?? this.fullName,
      page: page ?? this.page,
    );
  }

  NetworkConnectionsQuery resetPage() => copyWith(page: 0);
}

final networkConnectionsQueryProvider =
    StateProvider<NetworkConnectionsQuery>((ref) => const NetworkConnectionsQuery());

final networkConnectionsProvider =
    FutureProvider<NetworkPageResult<Connection>>((ref) {
  final q = ref.watch(networkConnectionsQueryProvider);
  return ref.watch(networkRepositoryProvider).searchConnections(
        fullName: q.fullName,
        page: q.page,
        size: 10,
      );
});

// ── Tab 4: Blocked members ────────────────────────────────────────────────────

class NetworkBlockedQuery {
  final String fullName;
  final int page;

  const NetworkBlockedQuery({this.fullName = '', this.page = 0});

  NetworkBlockedQuery copyWith({String? fullName, int? page}) {
    return NetworkBlockedQuery(
      fullName: fullName ?? this.fullName,
      page: page ?? this.page,
    );
  }

  NetworkBlockedQuery resetPage() => copyWith(page: 0);
}

final networkBlockedQueryProvider =
    StateProvider<NetworkBlockedQuery>((ref) => const NetworkBlockedQuery());

final networkBlockedProvider =
    FutureProvider<NetworkPageResult<BlockedMember>>((ref) {
  final q = ref.watch(networkBlockedQueryProvider);
  return ref.watch(networkRepositoryProvider).searchBlockedMembers(
        fullName: q.fullName,
        page: q.page,
        size: 10,
      );
});
