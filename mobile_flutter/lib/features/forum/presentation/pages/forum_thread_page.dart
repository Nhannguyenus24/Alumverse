import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_widget_from_html_core/flutter_widget_from_html_core.dart';
import 'package:intl/intl.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../shared/widgets/app_toast.dart';
import '../../../../shared/widgets/error_view.dart';
import '../../../auth/presentation/providers/auth_provider.dart';
import '../../data/models/forum_post.dart';
import '../../data/repositories/forum_repository.dart';
import '../providers/forum_providers.dart';

/// Thread detail + comments. Native port of the web `ForumAlumniThreadPage`:
/// lists posts (HTML content), like toggle, and a composer to add a comment.
class ForumThreadPage extends ConsumerStatefulWidget {
  const ForumThreadPage({super.key, required this.topicId, this.topicTitle});

  final int topicId;
  final String? topicTitle;

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
      ref.read(authStateProvider).valueOrNull?.user?.id);

  Future<void> _send() async {
    final text = _commentCtl.text.trim();
    if (text.isEmpty) return;
    final memberId = _memberId;
    if (memberId == null) {
      AppToast.info(context, 'Vui lòng đăng nhập để bình luận.');
      return;
    }
    setState(() => _sending = true);
    try {
      await ref.read(forumRepositoryProvider).createPost(
            topicId: widget.topicId,
            authorMemberId: memberId,
            // Wrap as a paragraph so it renders consistently with web HTML.
            content: '<p>${_escape(text)}</p>',
          );
      _commentCtl.clear();
      if (mounted) FocusScope.of(context).unfocus();
      ref.invalidate(forumPostsProvider(widget.topicId));
    } catch (e) {
      if (mounted) AppToast.error(context, 'Gửi bình luận thất bại.');
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

    return Scaffold(
      appBar: AppBar(title: Text(widget.topicTitle ?? 'Bài thảo luận')),
      body: Column(
        children: [
          Expanded(
            child: async.when(
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (_, __) => ErrorView(
                message: 'Không tải được bình luận',
                onRetry: () =>
                    ref.invalidate(forumPostsProvider(widget.topicId)),
              ),
              data: (posts) => RefreshIndicator(
                onRefresh: () async {
                  ref.invalidate(forumPostsProvider(widget.topicId));
                  await ref.read(forumPostsProvider(widget.topicId).future);
                },
                child: posts.isEmpty
                    ? ListView(
                        children: const [
                          SizedBox(height: 120),
                          Center(
                            child: Text('Chưa có bình luận nào',
                                style: TextStyle(
                                    color: AppColors.textSecondary)),
                          ),
                        ],
                      )
                    : ListView.separated(
                        padding: const EdgeInsets.all(16),
                        itemCount: posts.length,
                        separatorBuilder: (_, __) =>
                            const SizedBox(height: 12),
                        itemBuilder: (_, i) => _PostCard(
                          post: posts[i],
                          onLike: () => _toggleLike(posts[i]),
                        ),
                      ),
              ),
            ),
          ),
          _Composer(
            controller: _commentCtl,
            sending: _sending,
            onSend: _send,
          ),
        ],
      ),
    );
  }
}

class _PostCard extends StatelessWidget {
  const _PostCard({required this.post, required this.onLike});

  final ForumPost post;
  final VoidCallback onLike;

  @override
  Widget build(BuildContext context) {
    final date = post.createdAt != null
        ? DateFormat('dd/MM/yyyy • HH:mm').format(post.createdAt!)
        : '';
    final name = (post.authorName?.isNotEmpty ?? false)
        ? post.authorName!
        : 'Thành viên';

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
          Row(
            children: [
              CircleAvatar(
                radius: 16,
                backgroundColor: AppColors.primary.withValues(alpha: 0.1),
                child: Text(
                  name.characters.first.toUpperCase(),
                  style: const TextStyle(
                      color: AppColors.primary, fontWeight: FontWeight.bold),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(name,
                        style:
                            const TextStyle(fontWeight: FontWeight.w600)),
                    if (date.isNotEmpty)
                      Text(date,
                          style: const TextStyle(
                              fontSize: 11, color: AppColors.textSecondary)),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          HtmlWidget(
            post.content,
            textStyle: const TextStyle(fontSize: 14.5, height: 1.5),
          ),
          const SizedBox(height: 6),
          Align(
            alignment: Alignment.centerLeft,
            child: TextButton.icon(
              onPressed: onLike,
              icon: Icon(
                post.likedByMe ? Icons.favorite : Icons.favorite_border,
                size: 18,
                color: post.likedByMe ? AppColors.error : AppColors.textSecondary,
              ),
              label: Text('${post.likeCount}',
                  style: const TextStyle(color: AppColors.textSecondary)),
              style: TextButton.styleFrom(
                padding: const EdgeInsets.symmetric(horizontal: 8),
                minimumSize: const Size(0, 32),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _Composer extends StatelessWidget {
  const _Composer({
    required this.controller,
    required this.sending,
    required this.onSend,
  });

  final TextEditingController controller;
  final bool sending;
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
                minLines: 1,
                maxLines: 4,
                textInputAction: TextInputAction.newline,
                decoration: const InputDecoration(
                  hintText: 'Viết bình luận...',
                  isDense: true,
                  border: OutlineInputBorder(),
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
                        child: CircularProgressIndicator(strokeWidth: 2)),
                  )
                : IconButton.filled(
                    onPressed: onSend,
                    icon: const Icon(Icons.send),
                  ),
          ],
        ),
      ),
    );
  }
}
