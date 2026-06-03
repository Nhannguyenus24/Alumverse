import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/router/route_names.dart';
import '../../../../shared/widgets/logo.dart';
import '../providers/organization_provider.dart';

class OrganizationSelectPage extends ConsumerStatefulWidget {
  const OrganizationSelectPage({super.key});

  @override
  ConsumerState<OrganizationSelectPage> createState() =>
      _OrganizationSelectPageState();
}

class _OrganizationSelectPageState
    extends ConsumerState<OrganizationSelectPage> {
  final _ctl = TextEditingController();
  final _formKey = GlobalKey<FormState>();

  @override
  void dispose() {
    _ctl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;

    final slug = _ctl.text.trim();
    await ref.read(organizationStateProvider.notifier).fetchOrganization(slug);

    final orgState = ref.read(organizationStateProvider);
    if (!mounted) return;

    orgState.whenOrNull(
      data: (org) {
        if (org != null) {
          context.go(RouteNames.login);
        }
      },
      error: (e, _) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Tổ chức không tồn tại: $e')),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final loading = ref.watch(organizationStateProvider).isLoading;

    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Form(
            key: _formKey,
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const Center(child: AlumverseLogo(size: 80)),
                const SizedBox(height: 48),
                Text(
                  'Nhập đường dẫn tổ chức',
                  style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 8),
                const Text(
                  'Ví dụ: hcmus, fit-hcmus...',
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 32),
                TextFormField(
                  controller: _ctl,
                  validator: (v) => (v == null || v.isEmpty)
                      ? 'Vui lòng nhập slug tổ chức'
                      : null,
                  decoration: const InputDecoration(
                    labelText: 'Tên định danh tổ chức',
                    hintText: 'slug-to-chuc',
                    prefixIcon: Icon(Icons.link),
                  ),
                  onFieldSubmitted: (_) => _submit(),
                ),
                const SizedBox(height: 24),
                ElevatedButton(
                  onPressed: loading ? null : _submit,
                  style: ElevatedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 16),
                  ),
                  child: loading
                      ? const SizedBox(
                          height: 20,
                          width: 20,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: Colors.white,
                          ),
                        )
                      : const Text('Tiếp tục', style: TextStyle(fontSize: 16)),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
