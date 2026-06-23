import 'package:dio/dio.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/errors/api_exception.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../shared/widgets/app_toast.dart';
import '../../../../shared/widgets/empty_view.dart';
import '../../../../shared/widgets/error_view.dart';
import '../../../../shared/widgets/skeleton.dart';
import '../../data/models/pending_peer_verification.dart';
import '../../data/repositories/organization_repository.dart';
import '../providers/organization_provider.dart';

/// "Xác minh cựu sinh viên" — lists peer-verification requests the current user
/// received (others asking them to vouch for their identity) and lets them
/// accept. Native port of the web verification-management tab.
class AlumniVerificationPage extends ConsumerWidget {
  const AlumniVerificationPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(pendingPeerVerificationsProvider);

    return Scaffold(
      appBar: AppBar(title: Text('organization.verify_alumni'.tr())),
      body: async.when(
        loading: () => ListView(
          children: List.generate(4, (_) => const SkeletonTile()),
        ),
        error: (err, __) {
          // 403/404 = the user isn't a trusted verifier (or not a member) yet —
          // that's expected, not a load failure. Show a friendly explanation.
          final status = _statusOf(err);
          if (status == 403 || status == 404) {
            return EmptyView(
              icon: Icons.verified_user_outlined,
              title: 'organization.not_trusted_verifier'.tr(),
              message: 'organization.not_trusted_verifier_desc'.tr(),
            );
          }
          return ErrorView(
            message: 'organization.verification_requests_load_failed'.tr(),
            onRetry: () => ref.invalidate(pendingPeerVerificationsProvider),
          );
        },
        data: (items) {
          if (items.isEmpty) {
            return EmptyView(
              icon: Icons.verified_user_outlined,
              title: 'organization.no_verification_requests'.tr(),
              message: 'organization.no_verification_requests_desc'.tr(),
            );
          }
          return RefreshIndicator(
            onRefresh: () async {
              ref.invalidate(pendingPeerVerificationsProvider);
              await ref.read(pendingPeerVerificationsProvider.future);
            },
            child: ListView.separated(
              padding: const EdgeInsets.all(12),
              itemCount: items.length,
              separatorBuilder: (_, __) => const SizedBox(height: 10),
              itemBuilder: (_, i) => _RequestCard(item: items[i]),
            ),
          );
        },
      ),
    );
  }
}

/// Extract an HTTP status from an error (ApiException via DioException).
int? _statusOf(Object e) {
  if (e is ApiException) return e.statusCode;
  if (e is DioException) {
    final inner = e.error;
    if (inner is ApiException) return inner.statusCode;
    return e.response?.statusCode;
  }
  return null;
}

class _RequestCard extends ConsumerStatefulWidget {
  const _RequestCard({required this.item});
  final PendingPeerVerification item;

  @override
  ConsumerState<_RequestCard> createState() => _RequestCardState();
}

class _RequestCardState extends ConsumerState<_RequestCard> {
  bool _busy = false;

  Future<void> _accept() async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text('organization.verify_identity'.tr()),
        content: Text(
          'organization.verify_identity_confirm'.tr(
            namedArgs: {'name': widget.item.requesterName},
          ),
        ),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(ctx, false),
              child: Text('common.cancel'.tr())),
          ElevatedButton(
              onPressed: () => Navigator.pop(ctx, true),
              child: Text('organization.verify_action'.tr())),
        ],
      ),
    );
    if (ok != true) return;

    setState(() => _busy = true);
    try {
      await ref
          .read(organizationRepositoryProvider)
          .acceptPeerVerification(widget.item.requestId);
      ref.invalidate(pendingPeerVerificationsProvider);
      if (mounted) AppToast.success(context, 'organization.verify_success'.tr());
    } catch (e) {
      if (mounted) AppToast.error(context, 'organization.verify_failed'.tr());
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final item = widget.item;
    final time = item.createdAt != null
        ? DateFormat('dd/MM/yyyy • HH:mm').format(item.createdAt!)
        : '';

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.divider),
      ),
      child: Row(
        children: [
          const CircleAvatar(
            radius: 22,
            backgroundColor: AppColors.primaryLighter,
            child: Icon(Icons.person, color: AppColors.primary),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(item.requesterName,
                    style: const TextStyle(
                        fontWeight: FontWeight.w700, fontSize: 15)),
                const SizedBox(height: 2),
                Text('organization.verification_request_from'.tr(),
                    style: const TextStyle(
                        fontSize: 12.5, color: AppColors.textSecondary)),
                if (time.isNotEmpty)
                  Padding(
                    padding: const EdgeInsets.only(top: 2),
                    child: Text(time,
                        style: const TextStyle(
                            fontSize: 11, color: AppColors.textSecondary)),
                  ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          _busy
              ? const SizedBox(
                  width: 22,
                  height: 22,
                  child: CircularProgressIndicator(strokeWidth: 2),
                )
              : ElevatedButton(
                  onPressed: _accept,
                  style: ElevatedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 14, vertical: 8),
                  ),
                  child: Text('organization.verify_action'.tr()),
                ),
        ],
      ),
    );
  }
}
