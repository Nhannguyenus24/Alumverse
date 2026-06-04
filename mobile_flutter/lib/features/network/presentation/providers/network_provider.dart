import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../data/models/network_member.dart';
import '../../data/repositories/network_repository.dart';

/// A small sample of organization members for the home "Cộng đồng" section.
final featuredMembersProvider = FutureProvider<List<NetworkMember>>((ref) async {
  return ref.watch(networkRepositoryProvider).searchMembers(page: 0, size: 6);
});
