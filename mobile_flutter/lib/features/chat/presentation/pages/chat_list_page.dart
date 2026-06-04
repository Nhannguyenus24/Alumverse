import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

/// Placeholder chat list — referenced by the router; the chat feature is built
/// out separately.
class ChatListPage extends ConsumerWidget {
  const ChatListPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      appBar: AppBar(title: const Text('Tin nhắn')),
      body: const Center(child: Text('Chat sắp ra mắt')),
    );
  }
}
