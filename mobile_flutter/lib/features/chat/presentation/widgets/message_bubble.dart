import 'package:cached_network_image/cached_network_image.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/utils/image_url.dart';
import '../../data/models/chat_message.dart';
import 'chat_video_attachment.dart';
import 'image_viewer_page.dart';

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

  bool get _isMedia => message.messageType == 'IMAGE' || message.messageType == 'VIDEO';

  Widget _buildTimestamp(DateTime time) => Text(
        DateFormat('HH:mm').format(time.toLocal()),
        style: TextStyle(
          fontSize: 10.5,
          color: isMine ? Colors.white.withValues(alpha: 0.8) : AppColors.textSecondary,
        ),
      );

  Widget _buildSenderName() => Padding(
        padding: const EdgeInsets.only(bottom: 2),
        child: Text(
          message.senderFullName!,
          style: const TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w600,
            color: AppColors.primary,
          ),
        ),
      );

  Widget _buildImageAttachment(BuildContext context, String url, String? fileName) {
    final heroTag = 'chat_image_${message.id}';
    return GestureDetector(
      onTap: () => Navigator.of(context).push(
        MaterialPageRoute(
          builder: (_) => ImageViewerPage(imageUrl: url, heroTag: heroTag),
        ),
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(12),
        child: Hero(
          tag: heroTag,
          child: CachedNetworkImage(
            imageUrl: url,
            width: 220,
            fit: BoxFit.cover,
            placeholder: (context, _) => Container(
              width: 220,
              height: 160,
              color: AppColors.background,
              alignment: Alignment.center,
              child: const CircularProgressIndicator(strokeWidth: 2),
            ),
            errorWidget: (context, _, __) => Container(
              width: 220,
              height: 120,
              color: AppColors.background,
              alignment: Alignment.center,
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.broken_image_outlined, color: AppColors.textSecondary),
                  if (fileName != null) ...[
                    const SizedBox(height: 4),
                    Text(
                      fileName,
                      style: const TextStyle(fontSize: 11, color: AppColors.textSecondary),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final avatar = resolveImageUrl(message.senderAvatarUrl);
    final time = message.createdAtDate;
    final showName = showSender && !isMine && message.senderFullName != null;

    Widget bubble;
    if (_isMedia) {
      final meta = message.metadataMap;
      final fileName = meta?['fileName'] as String?;
      final resolvedUrl = resolveImageUrl(message.content);
      bubble = Column(
        crossAxisAlignment: isMine ? CrossAxisAlignment.end : CrossAxisAlignment.start,
        children: [
          if (showName) _buildSenderName(),
          if (resolvedUrl == null)
            Text(
              fileName ?? 'chat.attachment_unavailable'.tr(),
              style: const TextStyle(fontSize: 13, color: AppColors.textSecondary),
            )
          else if (message.messageType == 'IMAGE')
            _buildImageAttachment(context, resolvedUrl, fileName)
          else
            ChatVideoAttachment(url: resolvedUrl, fileName: fileName),
          if (time != null) ...[
            const SizedBox(height: 3),
            _buildTimestamp(time),
          ],
        ],
      );
    } else {
      bubble = Container(
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
            if (showName) _buildSenderName(),
            Text(
              message.content,
              style: TextStyle(
                fontSize: 14.5,
                color: isMine ? Colors.white : AppColors.textPrimary,
              ),
            ),
            if (time != null) ...[
              const SizedBox(height: 3),
              _buildTimestamp(time),
            ],
          ],
        ),
      );
    }

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
