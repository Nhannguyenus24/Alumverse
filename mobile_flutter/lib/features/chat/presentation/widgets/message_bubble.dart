import 'package:cached_network_image/cached_network_image.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/utils/image_url.dart';
import '../../data/models/chat_message.dart';

/// A single message bubble. Own messages are right-aligned in the brand colour;
/// others are left-aligned in grey. In group chats, other people's bubbles
/// show the sender's avatar and name.
class MessageBubble extends StatelessWidget {
  const MessageBubble({
    super.key,
    required this.message,
    required this.isMine,
    required this.showSender,
  });

  final ChatMessage message;
  final bool isMine;

  /// Whether to show the sender's name + avatar (group chats, others' messages).
  final bool showSender;

  @override
  Widget build(BuildContext context) {
    final avatar = resolveImageUrl(message.senderAvatarUrl);
    final time = message.createdAtDate;

    final bubble = Container(
      constraints: BoxConstraints(
        maxWidth: MediaQuery.of(context).size.width * 0.72,
      ),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: isMine ? AppColors.primary : AppColors.background,
        borderRadius: BorderRadius.circular(14),
        border: isMine ? null : Border.all(color: AppColors.divider),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (showSender && !isMine && message.senderFullName != null) ...[
            Text(
              message.senderFullName!,
              style: const TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: AppColors.primary,
              ),
            ),
            const SizedBox(height: 2),
          ],
          Text(
            message.content,
            style: TextStyle(
              fontSize: 14.5,
              color: isMine ? Colors.white : AppColors.textPrimary,
            ),
          ),
          if (time != null) ...[
            const SizedBox(height: 3),
            Text(
              DateFormat('HH:mm').format(time.toLocal()),
              style: TextStyle(
                fontSize: 10.5,
                color: isMine
                    ? Colors.white.withValues(alpha: 0.8)
                    : AppColors.textSecondary,
              ),
            ),
          ],
        ],
      ),
    );

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 3),
      child: Row(
        mainAxisAlignment:
            isMine ? MainAxisAlignment.end : MainAxisAlignment.start,
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          if (showSender && !isMine) ...[
            CircleAvatar(
              radius: 14,
              backgroundColor: AppColors.primary.withValues(alpha: 0.1),
              backgroundImage:
                  avatar != null ? CachedNetworkImageProvider(avatar) : null,
              child: avatar == null
                  ? const Icon(Icons.person, size: 16, color: AppColors.primary)
                  : null,
            ),
            const SizedBox(width: 6),
          ],
          Flexible(child: bubble),
        ],
      ),
    );
  }
}
