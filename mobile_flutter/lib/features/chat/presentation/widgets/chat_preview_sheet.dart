import 'package:cached_network_image/cached_network_image.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/router/route_names.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/utils/image_url.dart';
import '../../data/models/chat_recent_preview.dart';
import '../providers/chat_list_provider.dart';

/// Bottom sheet that mirrors the web MessagesPreviewPanel. Tap any item or
/// the see-all button to navigate to the full chat list.
class ChatPreviewSheet extends ConsumerWidget {
  const ChatPreviewSheet({super.key});

  void _goToChat(BuildContext context) {
    Navigator.of(context).pop();
    context.push(RouteNames.chat);
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(recentPreviewsProvider);

    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        // Drag handle
        Padding(
          padding: const EdgeInsets.only(top: 12, bottom: 4),
          child: Container(
            width: 36,
            height: 4,
            decoration: BoxDecoration(
              color: AppColors.divider,
              borderRadius: BorderRadius.circular(2),
            ),
          ),
        ),
        // Header
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 12),
          child: Row(
            children: [
              Text(
                'chat.title'.tr(),
                style: Theme.of(context).textTheme.titleLarge?.copyWith(
                  fontWeight: FontWeight.w700,
                  color: AppColors.primary,
                ),
              ),
            ],
          ),
        ),
        const Divider(height: 1, color: AppColors.divider),
        // Content
        ConstrainedBox(
          constraints: const BoxConstraints(maxHeight: 380),
          child: async.when(
            loading:
                () => const Padding(
                  padding: EdgeInsets.symmetric(vertical: 40),
                  child: Center(child: CircularProgressIndicator()),
                ),
            error:
                (_, __) => Padding(
                  padding: const EdgeInsets.symmetric(vertical: 40),
                  child: Center(
                    child: Text(
                      'chat.load_failed'.tr(),
                      style: const TextStyle(color: AppColors.textSecondary),
                    ),
                  ),
                ),
            data: (items) {
              if (items.isEmpty) {
                return Padding(
                  padding: const EdgeInsets.symmetric(vertical: 40),
                  child: Center(
                    child: Text(
                      'chat.no_conversations'.tr(),
                      style: const TextStyle(color: AppColors.textSecondary),
                    ),
                  ),
                );
              }
              return ListView.separated(
                shrinkWrap: true,
                itemCount: items.length,
                separatorBuilder:
                    (_, __) => const Divider(
                      height: 1,
                      indent: 72,
                      color: AppColors.divider,
                    ),
                itemBuilder:
                    (context, i) => _PreviewTile(
                      item: items[i],
                      onTap: () => _goToChat(context),
                    ),
              );
            },
          ),
        ),
        const Divider(height: 1, color: AppColors.divider),
        // See-all button
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          child: SizedBox(
            width: double.infinity,
            child: TextButton(
              onPressed: () => _goToChat(context),
              child: Text(
                'chat.see_all'.tr(),
                style: const TextStyle(fontWeight: FontWeight.w700),
              ),
            ),
          ),
        ),
        SizedBox(height: MediaQuery.of(context).padding.bottom),
      ],
    );
  }
}

class _PreviewTile extends StatelessWidget {
  const _PreviewTile({required this.item, required this.onTap});

  final ChatRecentPreview item;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final avatarUrl = resolveImageUrl(item.avatarUrl);
    final time =
        item.updatedAtDate != null
            ? DateFormat('HH:mm').format(item.updatedAtDate!)
            : '';

    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        child: Row(
          children: [
            CircleAvatar(
              radius: 22,
              backgroundColor: AppColors.primaryLighter,
              backgroundImage:
                  avatarUrl != null
                      ? CachedNetworkImageProvider(avatarUrl)
                      : null,
              child:
                  avatarUrl == null
                      ? Text(
                        item.name.isNotEmpty ? item.name[0].toUpperCase() : '?',
                        style: const TextStyle(
                          fontWeight: FontWeight.w600,
                          color: AppColors.primary,
                        ),
                      )
                      : null,
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          item.name,
                          style: const TextStyle(fontWeight: FontWeight.w600),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      if (time.isNotEmpty)
                        Text(
                          time,
                          style: const TextStyle(
                            fontSize: 12,
                            color: AppColors.textSecondary,
                          ),
                        ),
                    ],
                  ),
                  if (item.preview != null) ...[
                    const SizedBox(height: 2),
                    Text(
                      item.preview!,
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
          ],
        ),
      ),
    );
  }
}
