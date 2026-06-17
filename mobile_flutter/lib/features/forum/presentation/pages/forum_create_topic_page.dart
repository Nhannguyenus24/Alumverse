import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../auth/presentation/providers/auth_provider.dart';
import '../../../organization/presentation/providers/organization_provider.dart';
import '../../data/repositories/forum_repository.dart';
import '../providers/forum_providers.dart';

/// Create a new discussion topic. Native port of the web
/// `ForumAlumniCreateTopicPage`: title + optional opening content.
class ForumCreateTopicPage extends ConsumerStatefulWidget {
  const ForumCreateTopicPage({
    super.key,
    required this.categoryId,
    this.categoryName,
  });

  final int categoryId;
  final String? categoryName;

  @override
  ConsumerState<ForumCreateTopicPage> createState() =>
      _ForumCreateTopicPageState();
}

class _ForumCreateTopicPageState extends ConsumerState<ForumCreateTopicPage> {
  final _formKey = GlobalKey<FormState>();
  final _titleCtl = TextEditingController();
  final _contentCtl = TextEditingController();
  bool _submitting = false;

  @override
  void dispose() {
    _titleCtl.dispose();
    _contentCtl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;

    final orgId = ref.read(organizationStateProvider).valueOrNull?.id;
    final memberId = currentMemberIdFromUserId(
        ref.read(authStateProvider).valueOrNull?.user?.id);
    if (orgId == null || memberId == null) {
      _toast('Thiếu thông tin tổ chức hoặc tài khoản.');
      return;
    }

    setState(() => _submitting = true);
    try {
      final repo = ref.read(forumRepositoryProvider);
      final topicId = await repo.createTopic(
        organizationId: orgId,
        title: _titleCtl.text.trim(),
        createdByMemberId: memberId,
        categoryId: widget.categoryId,
      );

      // Opening post (optional) — best-effort, mirrors the web flow.
      final content = _contentCtl.text.trim();
      if (topicId != null && content.isNotEmpty) {
        try {
          await repo.createPost(
            topicId: topicId,
            authorMemberId: memberId,
            content: '<p>${_escape(content)}</p>',
          );
        } catch (_) {}
      }

      if (!mounted) return;
      _toast('Đã tạo bài thảo luận.');
      context.pop();
    } catch (e) {
      _toast('Tạo bài thảo luận thất bại.');
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  String _escape(String s) => s
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;');

  void _toast(String m) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(m)));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Tạo bài thảo luận')),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                if (widget.categoryName != null)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: Text('Chuyên mục: ${widget.categoryName}'),
                  ),
                TextFormField(
                  controller: _titleCtl,
                  validator: (v) => (v == null || v.trim().isEmpty)
                      ? 'Tiêu đề là bắt buộc'
                      : null,
                  decoration: const InputDecoration(
                    labelText: 'Tiêu đề',
                    prefixIcon: Icon(Icons.title),
                  ),
                ),
                const SizedBox(height: 16),
                TextFormField(
                  controller: _contentCtl,
                  minLines: 5,
                  maxLines: 10,
                  decoration: const InputDecoration(
                    labelText: 'Nội dung (tùy chọn)',
                    alignLabelWithHint: true,
                    border: OutlineInputBorder(),
                  ),
                ),
                const SizedBox(height: 24),
                ElevatedButton(
                  onPressed: _submitting ? null : _submit,
                  style: ElevatedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 16),
                  ),
                  child: _submitting
                      ? const SizedBox(
                          height: 20,
                          width: 20,
                          child: CircularProgressIndicator(
                              strokeWidth: 2, color: Colors.white),
                        )
                      : const Text('Đăng bài', style: TextStyle(fontSize: 16)),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
