import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/router/route_names.dart';
import '../../../../shared/widgets/app_toast.dart';
import '../../../../shared/widgets/error_view.dart';
import '../../../../shared/widgets/logo.dart';
import '../providers/organization_provider.dart';

/// Pick the organization to enter (Moodle-style gate). Loads the list of
/// organizations from the backend so the user chooses from a dropdown instead
/// of guessing a slug.
class OrganizationSelectPage extends ConsumerStatefulWidget {
  const OrganizationSelectPage({super.key});

  @override
  ConsumerState<OrganizationSelectPage> createState() =>
      _OrganizationSelectPageState();
}

class _OrganizationSelectPageState
    extends ConsumerState<OrganizationSelectPage> {
  String? _selectedSlug;

  Future<void> _enter(String slug) async {
    await ref.read(organizationStateProvider.notifier).fetchOrganization(slug);
    final orgState = ref.read(organizationStateProvider);
    if (!mounted) return;
    orgState.whenOrNull(
      data: (org) {
        if (org != null) context.go(RouteNames.login);
      },
      error:
          (e, _) => AppToast.error(context, 'organization.cannot_enter'.tr()),
    );
  }

  Future<void> _submitDropdown() async {
    final slug = _selectedSlug;
    if (slug == null) {
      AppToast.info(context, 'organization.select_org_please'.tr());
      return;
    }
    await _enter(slug);
  }

  @override
  Widget build(BuildContext context) {
    final loading = ref.watch(organizationStateProvider).isLoading;
    final listAsync = ref.watch(organizationListProvider);

    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Center(child: AlumverseLogo(size: 68)),
              const SizedBox(height: 48),
              Text(
                'organization.select'.tr(),
                style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 8),
              Text(
                'organization.select_org_desc'.tr(),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 32),
              listAsync.when(
                loading:
                    () => const Padding(
                      padding: EdgeInsets.symmetric(vertical: 24),
                      child: Center(child: CircularProgressIndicator()),
                    ),
                error:
                    (_, __) => ErrorView(
                      message: 'organization.org_list_load_failed'.tr(),
                      iconColor: Theme.of(context).colorScheme.primary,
                      onRetry: () => ref.invalidate(organizationListProvider),
                    ),
                data: (orgs) {
                  if (orgs.isEmpty) {
                    return ErrorView(
                      message: 'organization.org_list_load_failed'.tr(),
                      iconColor: Theme.of(context).colorScheme.primary,
                      onRetry: () => ref.invalidate(organizationListProvider),
                    );
                  }
                  return Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      // Material 3 dropdown: the menu opens BELOW the field
                      // (anchored), sized to the field, with rounded corners —
                      // not the full-width overlay that covers the field.
                      DropdownMenu<String>(
                        initialSelection: _selectedSlug,
                        expandedInsets: EdgeInsets.zero, // match field width
                        enabled: !loading,
                        requestFocusOnTap: false,
                        hintText: 'organization.select'.tr(),
                        leadingIcon: const Icon(Icons.apartment_rounded),
                        menuStyle: MenuStyle(
                          shape: WidgetStatePropertyAll(
                            RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                          ),
                          backgroundColor: const WidgetStatePropertyAll(
                            Colors.white,
                          ),
                        ),
                        inputDecorationTheme: const InputDecorationTheme(
                          border: OutlineInputBorder(),
                        ),
                        dropdownMenuEntries: [
                          for (final o in orgs)
                            DropdownMenuEntry(value: o.slug, label: o.name),
                        ],
                        onSelected:
                            loading
                                ? null
                                : (v) => setState(() => _selectedSlug = v),
                      ),
                      const SizedBox(height: 24),
                      ElevatedButton(
                        onPressed: loading ? null : _submitDropdown,
                        style: ElevatedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(vertical: 16),
                        ),
                        child:
                            loading
                                ? const SizedBox(
                                  height: 20,
                                  width: 20,
                                  child: CircularProgressIndicator(
                                    strokeWidth: 2,
                                    color: Colors.white,
                                  ),
                                )
                                : Text(
                                  'common.next'.tr(),
                                  style: const TextStyle(fontSize: 16),
                                ),
                      ),
                    ],
                  );
                },
              ),
            ],
          ),
        ),
      ),
    );
  }
}
