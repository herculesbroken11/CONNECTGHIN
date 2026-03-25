import 'package:flutter/foundation.dart';
import 'package:connectghin/core/network/dio_client.dart';

class AuthSessionController extends ChangeNotifier {
  AuthSessionController(this._tokens) {
    _init();
  }

  final TokenStore _tokens;
  bool _initialized = false;
  bool _isAuthenticated = false;

  bool get initialized => _initialized;
  bool get isAuthenticated => _isAuthenticated;

  Future<void> _init() async {
    final access = await _tokens.access;
    _isAuthenticated = access != null && access.isNotEmpty;
    _initialized = true;
    notifyListeners();
  }

  Future<void> setAuthenticated(bool value) async {
    _isAuthenticated = value;
    _initialized = true;
    notifyListeners();
  }
}
