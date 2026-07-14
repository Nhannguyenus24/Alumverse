import 'dart:io';

import 'package:dio/dio.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../constants/api_endpoints.dart';
import '../network/dio_client.dart';

/// Background/terminated message handler. Must be a top-level function.
@pragma('vm:entry-point')
Future<void> firebaseBackgroundHandler(RemoteMessage message) async {
  // Data-only handling could go here; notification payloads are shown by the OS.
}

const _channelId = 'high_importance_channel';

AndroidNotificationChannel _buildChannel() => AndroidNotificationChannel(
      _channelId,
      'notification.channel_name'.tr(),
      description: 'notification.channel_description'.tr(),
      importance: Importance.high,
    );

final pushNotificationServiceProvider = Provider<PushNotificationService>((ref) {
  return PushNotificationService(ref.watch(dioProvider));
});

class PushNotificationService {
  PushNotificationService(this._dio);

  final Dio _dio;
  final _fln = FlutterLocalNotificationsPlugin();
  bool _initialized = false;
  String? _lastToken;

  /// One-time setup: local-notification channel, foreground presentation,
  /// token-refresh listener. Safe to call more than once.
  Future<void> init() async {
    if (_initialized) return;
    _initialized = true;

    FirebaseMessaging.onBackgroundMessage(firebaseBackgroundHandler);

    await _fln.initialize(
      const InitializationSettings(
        android: AndroidInitializationSettings('@mipmap/ic_launcher'),
        iOS: DarwinInitializationSettings(),
      ),
    );
    await _fln
        .resolvePlatformSpecificImplementation<
            AndroidFlutterLocalNotificationsPlugin>()
        ?.createNotificationChannel(_buildChannel());

    await FirebaseMessaging.instance.setForegroundNotificationPresentationOptions(
      alert: true,
      badge: true,
      sound: true,
    );

    // Foreground: OS won't show FCM notifications automatically, so display
    // them via a local notification.
    FirebaseMessaging.onMessage.listen(_showLocal);

    FirebaseMessaging.instance.onTokenRefresh.listen((token) {
      _lastToken = token;
      _sendToken(token);
    });
  }

  /// Ask for OS notification permission, then register this device's token
  /// with the backend. Call after login.
  Future<void> registerToken() async {
    await FirebaseMessaging.instance.requestPermission();
    final token = await FirebaseMessaging.instance.getToken();
    if (token == null) return;
    _lastToken = token;
    await _sendToken(token);
  }

  /// Remove this device's token from the backend. Call on logout.
  Future<void> unregisterToken() async {
    try {
      final token = _lastToken ?? await FirebaseMessaging.instance.getToken();
      if (token != null) {
        await _dio.delete(ApiEndpoints.meDeviceTokenDelete(token));
      }
      await FirebaseMessaging.instance.deleteToken();
    } catch (e) {
      if (kDebugMode) debugPrint('unregisterToken failed: $e');
    } finally {
      _lastToken = null;
    }
  }

  Future<void> _sendToken(String token) async {
    try {
      await _dio.post(
        ApiEndpoints.meDeviceTokens,
        data: {'fcmToken': token, 'platform': Platform.isIOS ? 'ios' : 'android'},
      );
    } catch (e) {
      if (kDebugMode) debugPrint('registerToken failed: $e');
    }
  }

  void _showLocal(RemoteMessage message) {
    final n = message.notification;
    if (n == null) return;
    _fln.show(
      n.hashCode,
      n.title,
      n.body,
      NotificationDetails(
        android: AndroidNotificationDetails(
          _channelId,
          'notification.channel_name'.tr(),
          channelDescription: 'notification.channel_description'.tr(),
          importance: Importance.high,
          priority: Priority.high,
          icon: '@mipmap/ic_launcher',
        ),
        iOS: const DarwinNotificationDetails(),
      ),
      payload: message.data['link'] as String?,
    );
  }
}
