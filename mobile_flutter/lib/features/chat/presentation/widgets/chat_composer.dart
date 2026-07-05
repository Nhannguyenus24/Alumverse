import 'dart:io';

import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../shared/widgets/app_toast.dart';
import '../../data/models/chat_attachment_upload.dart';
import '../../data/repositories/chat_repository.dart';
import '../providers/chat_messages_provider.dart';
import 'emoji_picker_sheet.dart';

/// Message input row: attach button, multiline text field, emoji picker
/// button, and send button. Disabled when [enabled] is false (socket closed
/// or blocked).
class ChatComposer extends ConsumerStatefulWidget {
  const ChatComposer({
    super.key,
    required this.groupId,
    required this.chatType,
    required this.enabled,
    required this.onSend,
    this.hintText,
  });

  final int groupId;
  final String chatType; // GROUP | PRIVATE
  final bool enabled;
  final ValueChanged<String> onSend;
  final String? hintText;

  @override
  ConsumerState<ChatComposer> createState() => _ChatComposerState();
}

class _ChatComposerState extends ConsumerState<ChatComposer> {
  final TextEditingController _controller = TextEditingController();
  bool _canSend = false;
  bool _isUploading = false;

  @override
  void initState() {
    super.initState();
    _controller.addListener(() {
      final canSend = _controller.text.trim().isNotEmpty;
      if (canSend != _canSend) setState(() => _canSend = canSend);
    });
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _submit() {
    final text = _controller.text.trim();
    if (text.isEmpty || !widget.enabled) return;
    widget.onSend(text);
    _controller.clear();
  }

  bool get _canAttach => widget.enabled && !_isUploading;

  Future<void> _openAttachSheet() async {
    if (!_canAttach) return;
    final source = await showModalBottomSheet<_AttachChoice>(
      context: context,
      builder:
          (sheetContext) => SafeArea(
            child: Wrap(
              children: [
                ListTile(
                  leading: const Icon(
                    Icons.image_outlined,
                    color: AppColors.primary,
                  ),
                  title: Text('chat.attach_image'.tr()),
                  onTap: () => Navigator.pop(sheetContext, _AttachChoice.image),
                ),
                ListTile(
                  leading: const Icon(
                    Icons.videocam_outlined,
                    color: AppColors.primary,
                  ),
                  title: Text('chat.attach_video'.tr()),
                  onTap: () => Navigator.pop(sheetContext, _AttachChoice.video),
                ),
              ],
            ),
          ),
    );
    if (source == null || !mounted) return;
    await _pickAndSend(source);
  }

  Future<void> _pickAndSend(_AttachChoice choice) async {
    final picker = ImagePicker();
    final XFile? picked =
        choice == _AttachChoice.image
            ? await picker.pickImage(
              source: ImageSource.gallery,
              imageQuality: 85,
            )
            : await picker.pickVideo(
              source: ImageSource.gallery,
              maxDuration: const Duration(minutes: 1),
            );
    if (picked == null || !mounted) return;

    setState(() => _isUploading = true);
    try {
      final upload = await ref
          .read(chatRepositoryProvider)
          .uploadChatAttachment(File(picked.path));
      if (!mounted) return;
      ref
          .read(chatMessagesProvider(widget.groupId).notifier)
          .sendMedia(
            url: upload.url,
            messageType: upload.messageType,
            metadata: upload.metadata,
            chatType: widget.chatType,
          );
    } on ChatAttachmentException catch (e) {
      if (mounted) AppToast.error(context, e.messageKey.tr());
    } catch (e) {
      if (mounted) {
        AppToast.fromError(context, e, fallback: 'chat.upload_failed'.tr());
      }
    } finally {
      if (mounted) setState(() => _isUploading = false);
    }
  }

  void _insertEmoji(String emoji) {
    final value = _controller.value;
    final start =
        value.selection.isValid ? value.selection.start : value.text.length;
    final end =
        value.selection.isValid ? value.selection.end : value.text.length;
    final newText = value.text.replaceRange(start, end, emoji);
    _controller.value = TextEditingValue(
      text: newText,
      selection: TextSelection.collapsed(offset: start + emoji.length),
    );
  }

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      top: false,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: const BoxDecoration(
          color: AppColors.surface,
          border: Border(top: BorderSide(color: AppColors.divider)),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            IconButton(
              onPressed: _canAttach ? _openAttachSheet : null,
              icon:
                  _isUploading
                      ? const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                      : Icon(
                        Icons.attach_file_rounded,
                        color:
                            _canAttach
                                ? AppColors.textSecondary
                                : AppColors.secondaryLighter,
                      ),
              padding: EdgeInsets.zero,
              constraints: const BoxConstraints(minWidth: 36, minHeight: 36),
            ),
            const SizedBox(width: 4),
            IconButton(
              onPressed:
                  widget.enabled
                      ? () => EmojiPickerSheet.show(context, _insertEmoji)
                      : null,
              icon: Icon(
                Icons.emoji_emotions_outlined,
                color:
                    widget.enabled
                        ? AppColors.textSecondary
                        : AppColors.secondaryLighter,
              ),
              padding: EdgeInsets.zero,
              constraints: const BoxConstraints(minWidth: 36, minHeight: 36),
            ),
            const SizedBox(width: 4),
            Expanded(
              child: TextField(
                controller: _controller,
                enabled: widget.enabled,
                minLines: 1,
                maxLines: 4,
                textInputAction: TextInputAction.newline,
                decoration: InputDecoration(
                  hintText:
                      widget.enabled
                          ? (widget.hintText ?? 'chat.type_message'.tr())
                          : 'chat.cannot_send'.tr(),
                  filled: true,
                  fillColor: AppColors.background,
                  contentPadding: const EdgeInsets.symmetric(
                    horizontal: 14,
                    vertical: 10,
                  ),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(22),
                    borderSide: BorderSide.none,
                  ),
                ),
              ),
            ),
            const SizedBox(width: 8),
            CircleAvatar(
              radius: 22,
              backgroundColor:
                  (widget.enabled && _canSend)
                      ? AppColors.primary
                      : AppColors.secondaryLighter,
              child: IconButton(
                onPressed: (widget.enabled && _canSend) ? _submit : null,
                icon: const Icon(
                  Icons.send_rounded,
                  color: Colors.white,
                  size: 20,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

enum _AttachChoice { image, video }
