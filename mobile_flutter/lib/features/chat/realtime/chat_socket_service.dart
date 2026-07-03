import 'dart:async';
import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:web_socket_channel/web_socket_channel.dart';

import '../../../core/config/env.dart';
import '../../../core/constants/api_endpoints.dart';
import 'chat_socket_messages.dart';

enum ChatSocketStatus { idle, connecting, open, closed }

/// Single shared connection to `/ws/chat` for the whole app.
///
/// Mirrors the web `useChatWebSocket` lifecycle:
///  - JWT auth via the `?token=` query param (WS can't send headers);
///  - the socket is only marked [ChatSocketStatus.open] once the handshake
///    actually completes (`channel.ready`) — frames are queued until then, so
///    we never write `JOIN_GROUP` onto a half-open socket (which made the
///    server abort the connection right as it replied to the join);
///  - one persistent broadcast [events] stream that survives reconnects;
///  - auto-reconnect with exponential backoff (1, 2, 4, 8, 15s);
///  - an outbox that queues messages sent while disconnected and flushes on
///    reconnect; joined rooms are re-joined automatically after a drop.
class ChatSocketService {
  ChatSocketService(this._getValidToken);

  /// Returns a currently-valid access token for the handshake, refreshing it
  /// via the refresh-cookie if the stored one is expired. The WS sends the
  /// token as a query param and the server only validates it at handshake, so
  /// a stale token here means the connection is rejected on every reconnect —
  /// hence we refresh proactively, mirroring the REST [AuthInterceptor].
  final Future<String?> Function() _getValidToken;

  WebSocketChannel? _channel;
  StreamSubscription? _sub;

  final StreamController<ChatSocketEvent> _events =
      StreamController<ChatSocketEvent>.broadcast();
  Stream<ChatSocketEvent> get events => _events.stream;

  /// Connection status for the UI (e.g. to disable the composer when closed).
  final ValueNotifier<ChatSocketStatus> status =
      ValueNotifier(ChatSocketStatus.idle);

  static const List<int> _backoff = [1, 2, 4, 8, 15];

  final Set<int> _joinedGroups = {};
  final List<Map<String, dynamic>> _outbox = [];
  Timer? _reconnectTimer;
  int _retry = 0;
  bool _connecting = false;
  bool _disposed = false;

  /// Opens the connection if not already open/connecting. Safe to call
  /// repeatedly — extra calls are no-ops.
  Future<void> connect() async {
    if (_disposed || _connecting) return;
    if (status.value == ChatSocketStatus.open) return;

    _connecting = true;
    status.value = ChatSocketStatus.connecting;

    final token = await _getValidToken();
    if (token == null || token.isEmpty) {
      _connecting = false;
      status.value = ChatSocketStatus.closed;
      return;
    }

    final uri = Uri.parse(
      '${Env.wsBaseUrl}${ApiEndpoints.wsChat}?token=${Uri.encodeComponent(token)}',
    );

    try {
      final channel = WebSocketChannel.connect(uri);
      _channel = channel;
      // Wait for the real handshake before sending anything (matches the web
      // client's `ws.onopen`). Writing before this aborts the connection.
      await channel.ready;
      if (_disposed) {
        await channel.sink.close();
        return;
      }

      _sub = channel.stream.listen(
        _onData,
        onError: (_) => _scheduleReconnect(),
        onDone: _scheduleReconnect,
        cancelOnError: false,
      );
      status.value = ChatSocketStatus.open;
      _retry = 0;
      _connecting = false;
      _rejoinAndFlush();
    } catch (_) {
      _connecting = false;
      _scheduleReconnect();
    }
  }

  void joinGroup(int groupId) {
    _joinedGroups.add(groupId);
    if (status.value == ChatSocketStatus.open) {
      _rawSend(ChatSocketOutbound.joinGroup(groupId));
    } else {
      // Re-joined automatically once the handshake completes.
      connect();
    }
  }

  void leaveGroup(int groupId) {
    _joinedGroups.remove(groupId);
    if (status.value == ChatSocketStatus.open) {
      _rawSend(ChatSocketOutbound.leaveGroup(groupId));
    }
  }

  void sendMessage({
    required int groupId,
    required String content,
    required String chatType,
    String messageType = 'TEXT',
    Map<String, dynamic>? metadata,
  }) {
    final frame = ChatSocketOutbound.sendMessage(
      groupId: groupId,
      content: content,
      chatType: chatType,
      messageType: messageType,
      metadata: metadata,
    );
    if (status.value == ChatSocketStatus.open) {
      _rawSend(frame);
    } else {
      _outbox.add(frame);
      connect();
    }
  }

  void _rawSend(Map<String, dynamic> frame) {
    _channel?.sink.add(jsonEncode(frame));
  }

  void _rejoinAndFlush() {
    for (final groupId in _joinedGroups) {
      _rawSend(ChatSocketOutbound.joinGroup(groupId));
    }
    if (_outbox.isNotEmpty) {
      final pending = List<Map<String, dynamic>>.from(_outbox);
      _outbox.clear();
      for (final frame in pending) {
        _rawSend(frame);
      }
    }
  }

  void _onData(dynamic raw) {
    if (raw is! String) return;
    try {
      final decoded = jsonDecode(raw);
      if (decoded is Map<String, dynamic>) {
        _events.add(ChatSocketEvent.fromJson(decoded));
      }
    } catch (_) {
      // Ignore malformed frames.
    }
  }

  void _scheduleReconnect() {
    if (_disposed) return;
    _sub?.cancel();
    _sub = null;
    _channel?.sink.close();
    _channel = null;
    _connecting = false;
    status.value = ChatSocketStatus.closed;

    _reconnectTimer?.cancel();
    final secs = _backoff[_retry.clamp(0, _backoff.length - 1)];
    _retry++;
    _reconnectTimer = Timer(Duration(seconds: secs), () {
      if (!_disposed) connect();
    });
  }

  void dispose() {
    _disposed = true;
    _reconnectTimer?.cancel();
    _sub?.cancel();
    _channel?.sink.close();
    _events.close();
    status.dispose();
  }
}
