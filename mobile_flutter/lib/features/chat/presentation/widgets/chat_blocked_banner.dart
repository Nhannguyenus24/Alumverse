import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';

import '../../../../core/theme/app_colors.dart';
import '../../data/models/group_blocked_context.dart';

/// Banner shown above the composer when messaging is restricted.
///
/// Private chats: either the current user blocked the peer (with an unblock
/// action) or the peer blocked the current user. Group chats: a notice listing
/// blocked members (messaging itself stays allowed, as on the web).
class ChatBlockedBanner extends StatelessWidget {
  const ChatBlockedBanner._({
    required this.text,
    required this.color,
    this.actionLabel,
    this.onAction,
  });

  /// Private: current user blocked the peer.
  factory ChatBlockedBanner.blockedByMe({
    required String peerName,
    required VoidCallback onUnblock,
  }) {
    return ChatBlockedBanner._(
      text: 'chat.blocked_by_me'.tr(namedArgs: {'name': peerName}),
      color: AppColors.warning,
      actionLabel: 'network.unblock'.tr(),
      onAction: onUnblock,
    );
  }

  /// Private: the peer blocked the current user.
  factory ChatBlockedBanner.blockedByPeer({required String peerName}) {
    return ChatBlockedBanner._(
      text: 'chat.blocked_by_peer'.tr(namedArgs: {'name': peerName}),
      color: AppColors.error,
    );
  }

  /// Private: the peer's account is no longer active (banned/suspended/
  /// disabled/deleted/inactive).
  factory ChatBlockedBanner.peerInactive({required String peerName}) {
    return ChatBlockedBanner._(
      text: 'chat.peer_inactive'.tr(namedArgs: {'name': peerName}),
      color: AppColors.warning,
    );
  }

  /// Group: some members are blocked.
  factory ChatBlockedBanner.group(GroupBlockedContext context) {
    final names = context.blockedMembers.map((m) => m.fullName).join(', ');
    return ChatBlockedBanner._(
      text: 'chat.group_blocked'.tr(namedArgs: {'names': names}),
      color: AppColors.warning,
    );
  }

  final String text;
  final Color color;
  final String? actionLabel;
  final VoidCallback? onAction;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      color: color.withValues(alpha: 0.12),
      child: Row(
        children: [
          Icon(Icons.info_outline, size: 18, color: color),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              text,
              style: const TextStyle(
                fontSize: 13,
                color: AppColors.textPrimary,
              ),
            ),
          ),
          if (actionLabel != null && onAction != null)
            TextButton(
              onPressed: onAction,
              style: TextButton.styleFrom(
                padding: const EdgeInsets.symmetric(horizontal: 8),
                minimumSize: const Size(0, 0),
                tapTargetSize: MaterialTapTargetSize.shrinkWrap,
              ),
              child: Text(actionLabel!),
            ),
        ],
      ),
    );
  }
}
