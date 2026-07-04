import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../data/models/chat_message.dart';
import '../../data/repositories/chat_repository.dart';
import '../../realtime/chat_socket_messages.dart';
import '../../realtime/chat_socket_service.dart';
import 'chat_socket_provider.dart';

final chatMessagesProvider =
    AsyncNotifierProvider.family<ChatMessagesNotifier, List<ChatMessage>, int>(
      ChatMessagesNotifier.new,
    );

/// Messages for one conversation. Loads history over REST, then keeps the list
/// live from the WebSocket. Messages are held newest-first (the room renders a
/// `reverse: true` list, so index 0 sits at the bottom).
class ChatMessagesNotifier extends FamilyAsyncNotifier<List<ChatMessage>, int> {
  static const int _pageSize = 20;

  late ChatSocketService _socket;
  StreamSubscription<ChatSocketEvent>? _sub;
  int _page = 0;
  bool _hasMore = true;
  bool _loadingMore = false;

  int get _groupId => arg;
  bool get hasMore => _hasMore;
  bool get isLoadingMore => _loadingMore;

  @override
  Future<List<ChatMessage>> build(int groupId) async {
    _socket = ref.watch(chatSocketServiceProvider);
    _socket.connect();
    _socket.joinGroup(groupId);
    _sub = _socket.events.listen(_onEvent);

    ref.onDispose(() {
      _sub?.cancel();
      _socket.leaveGroup(groupId);
    });

    final messages = await ref
        .read(chatRepositoryProvider)
        .getMessages(groupId, page: 0, size: _pageSize);
    _page = 0;
    _hasMore = messages.length >= _pageSize;
    return messages; // already newest-first from the API
  }

  void _onEvent(ChatSocketEvent event) {
    if (event.type != 'MESSAGE_CREATED' || event.payload == null) return;
    final message = ChatMessage.fromJson(event.payload!);
    if (message.groupId != _groupId || message.isDeleted) return;

    final current = state.valueOrNull ?? const [];
    if (current.any((m) => m.id == message.id)) return;
    state = AsyncData([message, ...current]);
  }

  /// Sends a message over the socket. We do not optimistically append — the
  /// server echoes it back as `MESSAGE_CREATED` (mirrors the web client).
  void send(String content, {required String chatType}) {
    final trimmed = content.trim();
    if (trimmed.isEmpty) return;
    _socket.sendMessage(
      groupId: _groupId,
      content: trimmed,
      chatType: chatType,
    );
  }

  /// Sends an already-uploaded image/video attachment over the socket.
  void sendMedia({
    required String url,
    required String messageType,
    required Map<String, dynamic> metadata,
    required String chatType,
  }) {
    _socket.sendMessage(
      groupId: _groupId,
      content: url,
      chatType: chatType,
      messageType: messageType,
      metadata: metadata,
    );
  }

  /// Loads the next older page and appends it (older messages have higher
  /// indices in our newest-first list).
  Future<void> loadOlder() async {
    if (_loadingMore || !_hasMore) return;
    _loadingMore = true;
    try {
      final next = _page + 1;
      final older = await ref
          .read(chatRepositoryProvider)
          .getMessages(_groupId, page: next, size: _pageSize);
      _page = next;
      if (older.length < _pageSize) _hasMore = false;

      final current = state.valueOrNull ?? const [];
      final seen = current.map((m) => m.id).toSet();
      final fresh = older.where((m) => !seen.contains(m.id)).toList();
      if (fresh.isNotEmpty) state = AsyncData([...current, ...fresh]);
    } finally {
      _loadingMore = false;
    }
  }
}
