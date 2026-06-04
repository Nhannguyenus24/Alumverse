import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../shared/widgets/logo.dart';
import '../../../auth/presentation/providers/auth_provider.dart';
import '../../../organization/presentation/providers/organization_provider.dart';

/// Initial route shown while the auth + organization providers resolve.
/// Routing itself is owned by GoRouter's `redirect` (it parks the app here
/// until both providers settle, then forwards to org-select / login / home).
/// We only need to make sure both providers start loading.
class SplashPage extends ConsumerWidget {
  const SplashPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // Touch both providers so they begin resolving; redirect reacts to them.
    ref.watch(authStateProvider);
    ref.watch(organizationStateProvider);
    return const Scaffold(
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            AlumverseLogo(size: 96),
            SizedBox(height: 32),
            CircularProgressIndicator(),
          ],
        ),
      ),
    );
  }
}
