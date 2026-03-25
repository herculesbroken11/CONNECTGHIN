import 'dart:async';

import 'package:dio/dio.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:connectghin/features/auth/application/auth_providers.dart';

class PushNotificationsService {
  PushNotificationsService(this._dio);

  final Dio _dio;
  StreamSubscription<String>? _tokenRefreshSub;
  bool _initialized = false;
  String? _currentToken;

  Future<void> ensureRegistered() async {
    if (_initialized) return;
    _initialized = true;

    await _initializeFirebaseIfNeeded();

    final messaging = FirebaseMessaging.instance;
    await messaging.requestPermission(
      alert: true,
      badge: true,
      sound: true,
      provisional: false,
    );

    final token = await messaging.getToken();
    if (token != null && token.isNotEmpty) {
      _currentToken = token;
      await _registerToken(token);
    }

    _tokenRefreshSub = messaging.onTokenRefresh.listen((newToken) async {
      _currentToken = newToken;
      await _registerToken(newToken);
    });
  }

  Future<void> unregisterCurrentToken() async {
    final token = _currentToken;
    if (token == null || token.isEmpty) return;
    try {
      await _dio.delete(
        '/devices/register-token',
        queryParameters: {'token': token},
      );
    } catch (_) {
      // Best effort only; token can also expire naturally.
    }
  }

  Future<void> stop() async {
    await _tokenRefreshSub?.cancel();
    _tokenRefreshSub = null;
    _initialized = false;
  }

  Future<void> _initializeFirebaseIfNeeded() async {
    if (Firebase.apps.isNotEmpty) return;
    try {
      await Firebase.initializeApp();
    } catch (_) {
      // Missing platform firebase config should not crash app startup.
    }
  }

  Future<void> _registerToken(String token) async {
    try {
      await _dio.post(
        '/devices/register-token',
        data: {
          'token': token,
          'platform': _platformValue(),
        },
      );
    } catch (_) {
      // Keep startup/login resilient if push registration fails.
    }
  }

  String _platformValue() {
    if (kIsWeb) return 'WEB';
    switch (defaultTargetPlatform) {
      case TargetPlatform.iOS:
        return 'IOS';
      case TargetPlatform.android:
        return 'ANDROID';
      default:
        return 'WEB';
    }
  }
}

final pushNotificationsServiceProvider = Provider<PushNotificationsService>((
  ref,
) {
  return PushNotificationsService(ref.watch(dioProvider));
});
