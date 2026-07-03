import 'dart:convert';
import 'dart:io';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../datasources/chat_api.dart';
import '../models/chat_attachment_upload.dart';
import '../models/chat_conversation.dart';
import '../models/chat_group_member.dart';
import '../models/chat_message.dart';
import '../models/chat_recent_preview.dart';
import '../models/group_blocked_context.dart';

final chatRepositoryProvider = Provider<ChatRepository>((ref) {
  return ChatRepository(ref.watch(chatApiProvider));
});

class ChatRepository {
  ChatRepository(this._api);

  final ChatApi _api;

  static const _imageExtensions = {'jpg', 'jpeg', 'png', 'webp', 'gif'};
  static const _videoExtensions = {'mp4', 'mov', 'webm', 'm4v'};
  static const _imageMaxBytes = 10 * 1024 * 1024;
  static const _videoMaxBytes = 30 * 1024 * 1024;

  static const _mimeTypes = {
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'webp': 'image/webp',
    'gif': 'image/gif',
    'mp4': 'video/mp4',
    'mov': 'video/quicktime',
    'webm': 'video/webm',
    'm4v': 'video/x-m4v',
  };

  /// Validates, Base64-encodes and uploads a chat image/video attachment,
  /// routing static images through `/images/upload` (re-encoded to WebP) and
  /// gif/video through `/files/upload` (raw bytes, to preserve animation /
  /// avoid re-encoding a video). Throws [ChatAttachmentException] with an
  /// easy_localization key when the file is the wrong type or too large.
  Future<ChatAttachmentUpload> uploadChatAttachment(File file) async {
    final fileName = file.uri.pathSegments.last;
    final extension = _extensionOf(fileName);
    final isVideo = _videoExtensions.contains(extension);
    final isImage = !isVideo && _imageExtensions.contains(extension);

    if (!isVideo && !isImage) {
      throw const ChatAttachmentException('chat.file_type_unsupported');
    }

    final bytes = await file.readAsBytes();
    final maxBytes = isVideo ? _videoMaxBytes : _imageMaxBytes;
    if (bytes.length > maxBytes) {
      throw ChatAttachmentException(
        isVideo ? 'chat.video_too_large' : 'chat.image_too_large',
      );
    }

    final mimeType = _mimeTypes[extension] ?? 'application/octet-stream';
    final base64String = 'data:$mimeType;base64,${base64Encode(bytes)}';
    final useRawUpload = isVideo || extension == 'gif';

    final url = useRawUpload
        ? await _api.uploadMedia(base64String: base64String, fileName: fileName)
        : await _api.uploadImage(base64String);

    if (url.isEmpty) {
      throw const ChatAttachmentException('chat.upload_failed');
    }

    return ChatAttachmentUpload(
      url: url,
      messageType: isVideo ? 'VIDEO' : 'IMAGE',
      metadata: {'fileName': fileName, 'size': bytes.length, 'mimeType': mimeType},
    );
  }

  /// Validates, Base64-encodes and uploads a group avatar image (re-encoded
  /// to WebP server-side). Throws [ChatAttachmentException] with an
  /// easy_localization key when the file is the wrong type or too large.
  Future<String> uploadGroupImage(File file) async {
    final fileName = file.uri.pathSegments.last;
    final extension = _extensionOf(fileName);
    if (!_imageExtensions.contains(extension)) {
      throw const ChatAttachmentException('chat.file_type_unsupported');
    }

    final bytes = await file.readAsBytes();
    if (bytes.length > _imageMaxBytes) {
      throw const ChatAttachmentException('chat.image_too_large');
    }

    final mimeType = _mimeTypes[extension] ?? 'image/jpeg';
    final base64String = 'data:$mimeType;base64,${base64Encode(bytes)}';
    final url = await _api.uploadImage(base64String);

    if (url.isEmpty) {
      throw const ChatAttachmentException('chat.upload_failed');
    }

    return url;
  }

  /// Updates a group's avatar (owner only).
  Future<void> updateGroupAvatar(int groupId, String avatarUrl) =>
      _api.updateGroupAvatar(groupId, avatarUrl);

  String _extensionOf(String fileName) {
    final dot = fileName.lastIndexOf('.');
    if (dot < 0 || dot == fileName.length - 1) return '';
    return fileName.substring(dot + 1).toLowerCase();
  }

  /// Group + private chats merged into one list, sorted by last activity
  /// (newest first), mirroring the web sidebar. Conversations with no last
  /// message sort to the bottom.
  Future<List<ChatConversation>> listConversations({String? text}) async {
    final results = await Future.wait([
      _api.listGroups(text: text),
      _api.listPrivate(text: text),
    ]);
    final merged = [...results[0], ...results[1]];
    merged.sort((a, b) {
      final at = a.lastAt;
      final bt = b.lastAt;
      if (at == null && bt == null) return 0;
      if (at == null) return 1;
      if (bt == null) return -1;
      return bt.compareTo(at);
    });
    return merged;
  }

  Future<List<ChatMessage>> getMessages(
    int groupId, {
    int page = 0,
    int size = 20,
  }) =>
      _api.getMessages(groupId, page: page, size: size);

  Future<GroupBlockedContext> getBlockedContext(int groupId) =>
      _api.getBlockedContext(groupId);

  Future<ChatConversation> createGroup({
    String? title,
    required List<int> memberIds,
  }) =>
      _api.createGroup(title: title, memberIds: memberIds);

  Future<List<ChatGroupMember>> listMembers(int groupId) =>
      _api.listMembers(groupId);

  Future<void> addMembers(int groupId, List<int> memberIds) =>
      _api.addMembers(groupId, memberIds);

  Future<void> removeMember(int groupId, int memberId) =>
      _api.removeMember(groupId, memberId);

  Future<void> leaveGroup(int groupId) => _api.leaveGroup(groupId);

  Future<void> updateGroup(int groupId, String title) =>
      _api.updateGroup(groupId, title);

  Future<List<ChatRecentPreview>> recentPreviews() => _api.recentPreviews();
}
