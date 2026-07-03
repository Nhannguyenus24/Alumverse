/// Result of uploading a chat attachment (image or video): the public URL
/// plus the minimal metadata sent alongside the `SEND_MESSAGE` WS frame.
class ChatAttachmentUpload {
  final String url;
  final String messageType; // IMAGE | VIDEO
  final Map<String, dynamic> metadata;

  const ChatAttachmentUpload({
    required this.url,
    required this.messageType,
    required this.metadata,
  });
}

/// Thrown when a chat attachment fails client-side validation (unsupported
/// type / too large) or the upload itself fails. [messageKey] is an
/// easy_localization key (e.g. `chat.image_too_large`) for the caller to
/// show a translated toast.
class ChatAttachmentException implements Exception {
  final String messageKey;
  const ChatAttachmentException(this.messageKey);

  @override
  String toString() => messageKey;
}
