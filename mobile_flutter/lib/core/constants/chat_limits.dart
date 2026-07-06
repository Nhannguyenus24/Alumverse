/// Chat message length guard — mirrors the backend `ChatMessageLimits`
/// (200-char cap) and the web `messageContent.js` util, so mobile agrees with
/// both endpoints (REST conversation requests and the WebSocket send path).
const int kMaxChatMessageLength = 200;
