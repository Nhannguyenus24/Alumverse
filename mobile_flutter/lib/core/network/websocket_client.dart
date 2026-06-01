import 'dart:async';

import 'package:web_socket_channel/web_socket_channel.dart';

class WebSocketClient {
  WebSocketChannel? _channel;
  StreamController<dynamic>? _controller;

  Stream<dynamic> connect(Uri uri, {String? accessToken}) {
    disconnect();

    _channel = WebSocketChannel.connect(uri);

    _controller = StreamController<dynamic>.broadcast(
      onCancel: () => disconnect(),
    );

    _channel!.stream.listen(
      (event) => _controller?.add(event),
      onError: (Object error, StackTrace st) =>
          _controller?.addError(error, st),
      onDone: () => _controller?.close(),
      cancelOnError: false,
    );

    return _controller!.stream;
  }

  void send(dynamic data) {
    _channel?.sink.add(data);
  }

  Future<void> disconnect() async {
    await _channel?.sink.close();
    await _controller?.close();
    _channel = null;
    _controller = null;
  }
}
