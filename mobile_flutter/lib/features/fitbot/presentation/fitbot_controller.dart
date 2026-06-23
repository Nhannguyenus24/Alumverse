import 'dart:convert';

import 'package:dio/dio.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../data/fitbot_message.dart';
import '../data/fitbot_repository.dart';

const _storageKey = 'fitbot_chat_history';
const _ttl = Duration(days: 7);
const _maxMessages = 30;

FitBotMessage _welcomeMessage() => FitBotMessage(
      id: 'welcome',
      text: 'fitbot.greeting'.tr(),
      isBot: true,
      timestamp: DateTime.now(),
    );

class FitBotState {
  final List<FitBotMessage> messages;
  final bool isTyping;

  const FitBotState({this.messages = const [], this.isTyping = false});

  FitBotState copyWith({List<FitBotMessage>? messages, bool? isTyping}) =>
      FitBotState(
        messages: messages ?? this.messages,
        isTyping: isTyping ?? this.isTyping,
      );
}

class FitBotController extends StateNotifier<FitBotState> {
  FitBotController(this._repo) : super(const FitBotState()) {
    _restore();
  }

  final FitBotRepository _repo;
  CancelToken? _cancel;

  Future<void> _restore() async {
    final loaded = await _loadFromStorage();
    state = state.copyWith(
      messages: loaded.isEmpty ? [_welcomeMessage()] : loaded,
    );
  }

  Future<void> sendMessage(String text) async {
    final trimmed = text.trim();
    if (trimmed.isEmpty || state.isTyping) return;

    final userMsg = FitBotMessage(
      id: 'u${DateTime.now().microsecondsSinceEpoch}',
      text: trimmed,
      isBot: false,
      timestamp: DateTime.now(),
    );
    final botId = 'b${DateTime.now().microsecondsSinceEpoch}';
    final botMsg = FitBotMessage(
      id: botId,
      text: '',
      isBot: true,
      timestamp: DateTime.now(),
    );

    state = state.copyWith(
      messages: [...state.messages, userMsg, botMsg],
      isTyping: true,
    );

    _cancel?.cancel();
    _cancel = CancelToken();

    final buffer = StringBuffer();
    try {
      await for (final chunk
          in _repo.streamAnswer(trimmed, cancelToken: _cancel)) {
        buffer.write(chunk);
        _updateBot(botId, buffer.toString());
      }
      if (buffer.isEmpty) {
        _updateBot(botId, 'fitbot.no_answer'.tr());
      }
    } catch (e) {
      if (e is DioException && CancelToken.isCancel(e)) {
        // Cancelled — leave whatever was streamed so far.
      } else {
        _updateBot(botId, 'fitbot.server_error'.tr());
      }
    } finally {
      state = state.copyWith(isTyping: false);
      _persist();
    }
  }

  void _updateBot(String id, String text) {
    state = state.copyWith(
      messages: [
        for (final m in state.messages)
          if (m.id == id) m.copyWith(text: text) else m,
      ],
    );
  }

  void stop() {
    _cancel?.cancel();
    state = state.copyWith(isTyping: false);
  }

  void clear() {
    _cancel?.cancel();
    state = FitBotState(messages: [_welcomeMessage()]);
    _persist();
  }

  // ─── Persistence (mirrors the web localStorage history) ───────────────────

  List<FitBotMessage> _prune(List<FitBotMessage> messages) {
    final now = DateTime.now();
    final kept = messages
        .where((m) =>
            m.text.trim().isNotEmpty &&
            now.difference(m.timestamp) <= _ttl)
        .toList();
    if (kept.length <= _maxMessages) return kept;
    return kept.sublist(kept.length - _maxMessages);
  }

  Future<void> _persist() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final pruned = _prune(state.messages);
      final raw = jsonEncode(pruned.map((m) => m.toJson()).toList());
      await prefs.setString(_storageKey, raw);
    } catch (_) {
      // best-effort
    }
  }

  Future<List<FitBotMessage>> _loadFromStorage() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final raw = prefs.getString(_storageKey);
      if (raw == null || raw.isEmpty) return [];
      final decoded = jsonDecode(raw);
      if (decoded is! List) return [];
      final msgs = decoded
          .whereType<Map>()
          .map((m) => FitBotMessage.fromJson(m.cast<String, dynamic>()))
          .toList();
      return _prune(msgs);
    } catch (_) {
      return [];
    }
  }

  @override
  void dispose() {
    _cancel?.cancel();
    super.dispose();
  }
}

final fitBotControllerProvider =
    StateNotifierProvider<FitBotController, FitBotState>((ref) {
  return FitBotController(ref.watch(fitBotRepositoryProvider));
});
