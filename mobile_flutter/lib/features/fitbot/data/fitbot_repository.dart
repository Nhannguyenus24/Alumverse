import 'dart:async';
import 'dart:convert';

import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

final fitBotRepositoryProvider = Provider<FitBotRepository>((ref) {
  return FitBotRepository();
});

/// Talks to the HCMUS RAG assistant ("FitBot"). This is a separate service from
/// the app backend (hosted behind ngrok), so it uses its own bare Dio with no
/// auth/cookie interceptors. Mirrors the web `FitBot` SSE client.
class FitBotRepository {
  FitBotRepository() : _dio = Dio();

  final Dio _dio;

  // Same origin the web app proxies to via `/ngrok-api`.
  static const String _endpoint =
      'https://glimmer-clustered-exorcist.ngrok-free.dev/api/stream-query';

  /// Streams the assistant's answer for [question] token-by-token. Each text
  /// chunk is yielded as it arrives so the UI can render progressively.
  /// Throws on a network/HTTP failure (the caller shows a fallback message).
  Stream<String> streamAnswer(
    String question, {
    CancelToken? cancelToken,
  }) async* {
    final res = await _dio.post<ResponseBody>(
      _endpoint,
      data: {
        'question': question,
        'top_k': 10,
        'model': 'gemini-2.5-flash',
        'use_reranker': false,
      },
      options: Options(
        responseType: ResponseType.stream,
        headers: {
          'accept': 'text/event-stream, application/json',
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
        // Long-running stream — don't time out mid-answer.
        receiveTimeout: const Duration(minutes: 2),
      ),
      cancelToken: cancelToken,
    );

    final body = res.data;
    if (body == null) return;

    final contentType =
        (res.headers.value('content-type') ?? '').toLowerCase();

    // Non-streaming JSON response: read it all, extract the answer.
    if (contentType.contains('application/json')) {
      final buffer = StringBuffer();
      await for (final chunk in body.stream) {
        buffer.write(utf8.decode(chunk, allowMalformed: true));
      }
      final answer = _extractFromJson(buffer.toString());
      if (answer.isNotEmpty) yield answer;
      return;
    }

    // SSE streaming: parse `data:` lines.
    var lineBuffer = '';
    await for (final chunk in body.stream) {
      lineBuffer += utf8.decode(chunk, allowMalformed: true);
      final lines = lineBuffer.split('\n');
      lineBuffer = lines.removeLast(); // keep incomplete line
      for (final line in lines) {
        final text = _parseSseLine(line);
        if (text != null && text.isNotEmpty) yield text;
      }
    }
    final tail = _parseSseLine(lineBuffer);
    if (tail != null && tail.isNotEmpty) yield tail;
  }

  /// Parses a single SSE line; returns the text chunk or null.
  String? _parseSseLine(String line) {
    final trimmed = line.trim();
    if (trimmed.isEmpty || !trimmed.startsWith('data:')) return null;
    final dataStr = trimmed.substring(5).trim();
    if (dataStr.isEmpty || dataStr == '[DONE]') return null;
    try {
      final data = jsonDecode(dataStr);
      if (data is List) {
        return data
            .map((e) => e is Map
                ? (e['content'] ?? e['text'] ?? e['answer'] ?? '').toString()
                : e.toString())
            .join();
      }
      if (data is Map) {
        // Skip "sources" frames (we don't show references).
        if (data['type'] == 'sources' || data['sources'] is List) return '';
        final msg = data['message'];
        return (data['answer'] ??
                data['response'] ??
                data['text'] ??
                data['content'] ??
                (msg is Map ? msg['content'] : null) ??
                '')
            .toString();
      }
      return data.toString();
    } catch (_) {
      // Plain-text data frame.
      return dataStr;
    }
  }

  String _extractFromJson(String raw) {
    try {
      final data = jsonDecode(raw);
      if (data is List) {
        return data
            .map((e) => e is Map
                ? (e['content'] ?? e['text'] ?? e['answer'] ?? '').toString()
                : e.toString())
            .join();
      }
      if (data is Map) {
        final msg = data['message'];
        return (data['answer'] ??
                data['response'] ??
                data['text'] ??
                data['content'] ??
                (msg is Map ? msg['content'] : null) ??
                '')
            .toString();
      }
      return data.toString();
    } catch (_) {
      return raw;
    }
  }
}
