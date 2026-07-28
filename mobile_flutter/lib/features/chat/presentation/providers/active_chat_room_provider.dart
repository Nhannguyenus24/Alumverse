import 'package:flutter_riverpod/flutter_riverpod.dart';

/// Group id of the chat room currently open on screen, or null. Set by
/// [ChatMessagesNotifier] while its page is mounted.
final activeChatRoomIdProvider = StateProvider<int?>((ref) => null);
