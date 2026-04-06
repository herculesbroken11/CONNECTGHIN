import 'package:flutter/foundation.dart';

/// Backend base URL (scheme + host + path prefix), set at compile time.
///
/// **Debug / profile:** defaults to `http://10.0.2.2:3000/api/v1` (Android
/// emulator → host). Do not use `localhost` from the emulator.
///
/// **Release:** there is no default — you must pass
/// `--dart-define=API_BASE_URL=https://api.yourdomain.com/api/v1` (use HTTPS
/// in production). CI/CD should inject the real URL per environment.
class AppEnv {
  static const String apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: kReleaseMode ? '' : 'http://10.0.2.2:3000/api/v1',
  );
}
