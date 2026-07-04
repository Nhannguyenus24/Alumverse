import 'package:cached_network_image/cached_network_image.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';

import '../../../../../core/theme/app_colors.dart';
import '../../../../../core/utils/image_url.dart';
import '../../data/models/conversation_request.dart';

/// Card for an incoming connection request (Tab 2).
class ConversationRequestCard extends StatelessWidget {
  const ConversationRequestCard({
    super.key,
    required this.request,
    required this.onAccept,
    required this.onReject,
    required this.onViewProfile,
    this.isLoading = false,
  });

  final ConversationRequest request;
  final VoidCallback onAccept;
  final VoidCallback onReject;
  final VoidCallback onViewProfile;
  final bool isLoading;

  @override
  Widget build(BuildContext context) {
    final avatar = resolveImageUrl(request.avatarUrl);

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.divider),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.all(12),
            child: Row(
              children: [
                GestureDetector(
                  onTap: onViewProfile,
                  child: CircleAvatar(
                    radius: 26,
                    backgroundColor: AppColors.primary.withValues(alpha: 0.1),
                    backgroundImage:
                        avatar != null
                            ? CachedNetworkImageProvider(avatar)
                            : null,
                    child:
                        avatar == null
                            ? const Icon(
                              Icons.person,
                              size: 28,
                              color: AppColors.primary,
                            )
                            : null,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: GestureDetector(
                    onTap: onViewProfile,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          request.fullName,
                          style: const TextStyle(
                            fontWeight: FontWeight.w600,
                            fontSize: 15,
                            color: AppColors.textPrimary,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        const SizedBox(height: 2),
                        _StatusChip(status: request.status),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
          if (request.message != null && request.message!.isNotEmpty)
            Padding(
              padding: const EdgeInsets.only(left: 12, right: 12, bottom: 12),
              child: Container(
                width: double.infinity,
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: AppColors.background,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  request.message!,
                  style: const TextStyle(
                    color: AppColors.textPrimary,
                    fontSize: 13,
                    height: 1.4,
                  ),
                  maxLines: 3,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ),
          if (request.isPending) ...[
            const Divider(height: 1, color: AppColors.divider),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
              child:
                  isLoading
                      ? const Center(
                        child: SizedBox(
                          width: 24,
                          height: 24,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        ),
                      )
                      : Row(
                        children: [
                          Expanded(
                            child: OutlinedButton(
                              onPressed: onReject,
                              style: OutlinedButton.styleFrom(
                                foregroundColor: AppColors.error,
                                side: const BorderSide(color: AppColors.error),
                              ),
                              child: Text('network.reject'.tr()),
                            ),
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: ElevatedButton(
                              onPressed: onAccept,
                              style: ElevatedButton.styleFrom(
                                backgroundColor: AppColors.primary,
                                foregroundColor: Colors.white,
                              ),
                              child: Text('network.accept'.tr()),
                            ),
                          ),
                        ],
                      ),
            ),
          ],
        ],
      ),
    );
  }
}

class _StatusChip extends StatelessWidget {
  const _StatusChip({required this.status});

  final String status;

  @override
  Widget build(BuildContext context) {
    final isPending = status == 'PENDING';
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      decoration: BoxDecoration(
        color: (isPending ? AppColors.warning : AppColors.textSecondary)
            .withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(4),
      ),
      child: Text(
        isPending
            ? 'network.pending_request'.tr()
            : 'network.filter_rejected'.tr(),
        style: TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.w500,
          color: isPending ? AppColors.warning : AppColors.textSecondary,
        ),
      ),
    );
  }
}
