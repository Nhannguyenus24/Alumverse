import 'package:cached_network_image/cached_network_image.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_widget_from_html_core/flutter_widget_from_html_core.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/router/route_names.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/utils/image_url.dart';
import '../../../../core/utils/relative_time.dart';
import '../../../../shared/widgets/app_toast.dart';
import '../../../../shared/widgets/error_view.dart';
import '../../../auth/presentation/providers/auth_provider.dart';
import '../../../user/presentation/providers/user_providers.dart';
import '../../data/models/forum_post.dart';
import '../../data/models/forum_topic.dart';
import '../../data/repositories/forum_repository.dart';
import '../providers/forum_providers.dart';

/// Thread detail + comments. Native port of the web `ForumAlumniThreadPage`:
/// lists posts (HTML content), like toggle, and a composer to add a comment.
class ForumThreadPage extends ConsumerStatefulWidget {
  const ForumThreadPage({
    super.key,
    required this.topicId,
    this.topicTitle,
    this.initialTopic,
  });

  final int topicId;
  final String? topicTitle;
  final ForumTopic? initialTopic;

  @override
  ConsumerState<ForumThreadPage> createState() => _ForumThreadPageState();
}

class _ForumThreadPageState extends ConsumerState<ForumThreadPage> {
  final _commentCtl = TextEditingController();
  bool _sending = false;

  @override
  void dispose() {
    _commentCtl.dispose();
    super.dispose();
  }

  int? get _memberId => currentMemberIdFromUserId(
    ref.read(authStateProvider).valueOrNull?.user?.id,
  );

  Future<void> _send() async {
    final text = _commentCtl.text.trim();
    if (text.isEmpty) return;
    final memberId = _memberId;
    if (memberId == null) {
      AppToast.info(context, 'forum.login_to_comment'.tr());
      return;
    }
    final canContribute = await ref.read(canContributeProvider.future);
    if (!canContribute) {
      if (!mounted) return;
      AppToast.info(
        context,
        'mentorship.mentee_signup_not_eligible_academic'.tr(),
      );
      return;
    }
    setState(() => _sending = true);
    try {
      await ref
          .read(forumRepositoryProvider)
          .createPost(
            topicId: widget.topicId,
            authorMemberId: memberId,
            // Wrap as a paragraph so it renders consistently with web HTML.
            content: '<p>${_escape(text)}</p>',
          );
      _commentCtl.clear();
      if (mounted) FocusScope.of(context).unfocus();
      ref.invalidate(forumPostsProvider(widget.topicId));
    } catch (e) {
      if (mounted) AppToast.error(context, 'forum.send_comment_failed'.tr());
    } finally {
      if (mounted) setState(() => _sending = false);
    }
  }

  Future<void> _toggleLike(ForumPost post) async {
    final memberId = _memberId;
    if (memberId == null) return;
    try {
      await ref
          .read(forumRepositoryProvider)
          .toggleReaction(postId: post.id, memberId: memberId);
      ref.invalidate(forumPostsProvider(widget.topicId));
    } catch (_) {}
  }

  String _escape(String s) => s
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;');

  @override
  Widget build(BuildContext context) {
    final async = ref.watch(forumPostsProvider(widget.topicId));
    final canContributeAsync = ref.watch(canContributeProvider);
    final canContribute = canContributeAsync.valueOrNull ?? false;

    return Scaffold(
      appBar: AppBar(title: Text(widget.topicTitle ?? 'forum.discussion'.tr())),
      body: Column(
        children: [
          Expanded(
            child: async.when(
              loading: () => const Center(child: CircularProgressIndicator()),
              error:
                  (_, __) => ErrorView(
                    message: 'forum.load_comments_failed'.tr(),
                    onRetry:
                        () =>
                            ref.invalidate(forumPostsProvider(widget.topicId)),
                  ),
              data: (posts) {
                final openingPost = posts.isNotEmpty ? posts.first : null;
                final replies =
                    posts.length > 1 ? posts.sublist(1) : const <ForumPost>[];

                return RefreshIndicator(
                  onRefresh: () async {
                    ref.invalidate(forumPostsProvider(widget.topicId));
                    await ref.read(forumPostsProvider(widget.topicId).future);
                  },
                  child: ListView(
                    padding: const EdgeInsets.all(16),
                    children: [
                      _ThreadHeader(
                        title: widget.topicTitle ?? 'forum.discussion'.tr(),
                        post: openingPost,
                        topic: widget.initialTopic,
                        replyCount:
                            widget.initialTopic?.replyCount ?? replies.length,
                      ),
                      const SizedBox(height: 18),
                      if (openingPost != null) ...[
                        _OpeningPostCard(
                          post: openingPost,
                          onLike: () => _toggleLike(openingPost),
                        ),
                        const SizedBox(height: 12),
                      ],
                      if (replies.isEmpty)
                        const _NoCommentsView()
                      else
                        for (var i = 0; i < replies.length; i++) ...[
                          if (i > 0) const SizedBox(height: 12),
                          _PostCard(
                            post: replies[i],
                            onLike: () => _toggleLike(replies[i]),
                          ),
                        ],
                    ],
                  ),
                );
              },
            ),
          ),
          _Composer(
            controller: _commentCtl,
            sending: _sending || canContributeAsync.isLoading,
            canContribute: canContribute,
            onSend: _send,
          ),
        ],
      ),
    );
  }
}

class _OpeningPostCard extends StatelessWidget {
  const _OpeningPostCard({required this.post, required this.onLike});

  final ForumPost post;
  final VoidCallback onLike;

  @override
  Widget build(BuildContext context) {
    final hasContent = post.content.trim().isNotEmpty;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.divider),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _PostAuthorRow(post: post),
          if (hasContent) ...[
            const SizedBox(height: 12),
            HtmlWidget(
              post.content,
              textStyle: const TextStyle(fontSize: 15, height: 1.55),
            ),
            const SizedBox(height: 6),
          ],
          _LikeButton(post: post, onLike: onLike),
        ],
      ),
    );
  }
}

class _ThreadHeader extends StatelessWidget {
  const _ThreadHeader({
    required this.title,
    required this.post,
    required this.topic,
    required this.replyCount,
  });

  final String title;
  final ForumPost? post;
  final ForumTopic? topic;
  final int replyCount;

  @override
  Widget build(BuildContext context) {
    final authorName = _resolveHeaderAuthorName();
    final avatarUrl = post?.authorAvatarUrl ?? topic?.authorAvatarUrl;
    final createdAt = post?.createdAt ?? topic?.createdAt;
    final createdLabel = formatRelativeTimeVi(createdAt);
    final views = topic?.viewCount ?? 0;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: const TextStyle(
            color: AppColors.primaryDark,
            fontSize: 21,
            fontWeight: FontWeight.w800,
            height: 1.25,
          ),
        ),
        const SizedBox(height: 14),
        Row(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            _ForumAvatar(name: authorName, avatarUrl: avatarUrl, radius: 16),
            const SizedBox(width: 8),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    authorName,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      color: AppColors.textPrimary,
                      fontSize: 13,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  if (createdLabel.isNotEmpty)
                    Text(
                      createdLabel,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        color: AppColors.textSecondary,
                        fontSize: 11,
                      ),
                    ),
                ],
              ),
            ),
            const SizedBox(width: 12),
            _CompactStat(icon: Icons.visibility_outlined, value: views),
            const SizedBox(width: 10),
            _CompactStat(icon: Icons.chat_bubble_outline, value: replyCount),
          ],
        ),
      ],
    );
  }

  String _resolveHeaderAuthorName() {
    final postName = post?.authorName?.trim();
    if (postName?.isNotEmpty == true) return postName!;

    final topicName = topic?.authorName?.trim();
    if (topicName?.isNotEmpty == true) return topicName!;

    final id = topic?.createdByMemberId ?? post?.authorMemberId;
    if (id != null) {
      return 'forum.member_id'.tr(namedArgs: {'id': id.toString()});
    }

    return 'forum.member'.tr();
  }
}

class _CompactStat extends StatelessWidget {
  const _CompactStat({required this.icon, required this.value});

  final IconData icon;
  final int value;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 16, color: AppColors.primary),
        const SizedBox(width: 4),
        Text(
          '$value',
          style: const TextStyle(
            color: AppColors.primary,
            fontWeight: FontWeight.w800,
            fontSize: 13,
            height: 1,
          ),
        ),
      ],
    );
  }
}

class _ForumAvatar extends StatelessWidget {
  const _ForumAvatar({
    required this.name,
    required this.avatarUrl,
    required this.radius,
  });

  final String name;
  final String? avatarUrl;
  final double radius;

  @override
  Widget build(BuildContext context) {
    final resolved = resolveImageUrl(avatarUrl);

    return CircleAvatar(
      radius: radius,
      backgroundColor: AppColors.primaryLighter,
      backgroundImage:
          resolved != null ? CachedNetworkImageProvider(resolved) : null,
      child:
          resolved == null
              ? Text(
                name.characters.first.toUpperCase(),
                style: const TextStyle(
                  color: AppColors.primary,
                  fontWeight: FontWeight.bold,
                ),
              )
              : null,
    );
  }
}

class _PostCard extends StatelessWidget {
  const _PostCard({required this.post, required this.onLike});

  final ForumPost post;
  final VoidCallback onLike;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.divider),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _PostAuthorRow(post: post),
          const SizedBox(height: 8),
          HtmlWidget(
            post.content,
            textStyle: const TextStyle(fontSize: 14.5, height: 1.5),
          ),
          const SizedBox(height: 6),
          _LikeButton(post: post, onLike: onLike),
        ],
      ),
    );
  }
}

class _PostAuthorRow extends StatelessWidget {
  const _PostAuthorRow({required this.post});

  final ForumPost post;

  @override
  Widget build(BuildContext context) {
    final date =
        post.createdAt != null
            ? DateFormat('dd/MM/yyyy • HH:mm').format(post.createdAt!)
            : '';
    final name =
        (post.authorName?.trim().isNotEmpty ?? false)
            ? post.authorName!.trim()
            : post.authorMemberId != null
            ? 'forum.member_id'.tr(
              namedArgs: {'id': post.authorMemberId.toString()},
            )
            : 'forum.member'.tr();
    final avatarUrl = post.authorAvatarUrl;

    return Row(
      children: [
        _ForumAvatar(name: name, avatarUrl: avatarUrl, radius: 16),
        const SizedBox(width: 10),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                name,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(fontWeight: FontWeight.w600),
              ),
              if (date.isNotEmpty)
                Text(
                  date,
                  style: const TextStyle(
                    fontSize: 11,
                    color: AppColors.textSecondary,
                  ),
                ),
            ],
          ),
        ),
      ],
    );
  }
}

class _LikeButton extends StatelessWidget {
  const _LikeButton({required this.post, required this.onLike});

  final ForumPost post;
  final VoidCallback? onLike;

  @override
  Widget build(BuildContext context) {
    return Align(
      alignment: Alignment.centerLeft,
      child: TextButton.icon(
        onPressed: onLike,
        icon: Icon(
          post.likedByMe ? Icons.favorite : Icons.favorite_border,
          size: 18,
          color: post.likedByMe ? AppColors.error : AppColors.textSecondary,
        ),
        label: Text(
          '${post.likeCount}',
          style: const TextStyle(color: AppColors.textSecondary),
        ),
        style: TextButton.styleFrom(
          padding: const EdgeInsets.symmetric(horizontal: 8),
          minimumSize: const Size(0, 32),
        ),
      ),
    );
  }
}

class _NoCommentsView extends StatelessWidget {
  const _NoCommentsView();

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 24),
      child: Center(
        child: Text(
          'forum.no_comments'.tr(),
          style: const TextStyle(color: AppColors.textSecondary),
        ),
      ),
    );
  }
}

class _Composer extends StatelessWidget {
  const _Composer({
    required this.controller,
    required this.sending,
    required this.canContribute,
    required this.onSend,
  });

  final TextEditingController controller;
  final bool sending;
  final bool canContribute;
  final VoidCallback onSend;

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      top: false,
      child: Container(
        padding: const EdgeInsets.fromLTRB(12, 8, 12, 8),
        decoration: const BoxDecoration(
          color: AppColors.surface,
          border: Border(top: BorderSide(color: AppColors.divider)),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            Expanded(
              child: TextField(
                controller: controller,
                enabled: canContribute,
                minLines: 1,
                maxLines: 4,
                textInputAction: TextInputAction.newline,
                decoration: InputDecoration(
                  hintText:
                      canContribute
                          ? 'forum.write_comment'.tr()
                          : 'mentorship.mentee_signup_not_eligible_academic'
                              .tr(),
                  isDense: true,
                  border: const OutlineInputBorder(),
                ),
              ),
            ),
            const SizedBox(width: 8),
            sending
                ? const Padding(
                  padding: EdgeInsets.all(8),
                  child: SizedBox(
                    height: 22,
                    width: 22,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  ),
                )
                : IconButton.filled(
                  onPressed:
                      canContribute
                          ? onSend
                          : () =>
                              context.push(RouteNames.organizationRegistration),
                  icon: Icon(
                    canContribute ? Icons.send : Icons.verified_user_outlined,
                  ),
                ),
          ],
        ),
      ),
    );
  }
}
