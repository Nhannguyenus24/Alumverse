import 'package:cached_network_image/cached_network_image.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';

import '../../../../../core/theme/app_colors.dart';
import '../../../../../core/utils/image_url.dart';
import '../../data/models/connection.dart';

/// Card for an accepted connection (Tab 3).
class ConnectionCard extends StatelessWidget {
  const ConnectionCard({
    super.key,
    required this.connection,
    required this.onChat,
    required this.onViewProfile,
    required this.onBlock,
  });

  final Connection connection;
  final VoidCallback onChat;
  final VoidCallback onViewProfile;
  final VoidCallback onBlock;

  @override
  Widget build(BuildContext context) {
    final avatar = resolveImageUrl(connection.avatarUrl);

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.divider),
      ),
      child: Row(
        children: [
          GestureDetector(
            onTap: onViewProfile,
            child: CircleAvatar(
              radius: 26,
              backgroundColor: AppColors.primary.withValues(alpha: 0.1),
              backgroundImage:
                  avatar != null ? CachedNetworkImageProvider(avatar) : null,
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
                    connection.fullName,
                    style: const TextStyle(
                      fontWeight: FontWeight.w600,
                      fontSize: 15,
                      color: AppColors.textPrimary,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  if (connection.subtitle.isNotEmpty) ...[
                    const SizedBox(height: 2),
                    Text(
                      connection.subtitle,
                      style: const TextStyle(
                        color: AppColors.textSecondary,
                        fontSize: 13,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ],
              ),
            ),
          ),
          const SizedBox(width: 8),
          IconButton(
            onPressed: onChat,
            icon: const Icon(
              Icons.chat_rounded,
              color: AppColors.primary,
              size: 22,
            ),
            tooltip: 'network.message'.tr(),
          ),
          PopupMenuButton<_Action>(
            onSelected: (action) {
              if (action == _Action.block) onBlock();
            },
            itemBuilder:
                (_) => [
                  PopupMenuItem(
                    value: _Action.block,
                    child: Row(
                      children: [
                        const Icon(
                          Icons.block,
                          color: AppColors.error,
                          size: 18,
                        ),
                        const SizedBox(width: 8),
                        Text(
                          'network.block'.tr(),
                          style: const TextStyle(color: AppColors.error),
                        ),
                      ],
                    ),
                  ),
                ],
            icon: const Icon(
              Icons.more_vert,
              color: AppColors.textSecondary,
              size: 20,
            ),
          ),
        ],
      ),
    );
  }
}

enum _Action { block }
