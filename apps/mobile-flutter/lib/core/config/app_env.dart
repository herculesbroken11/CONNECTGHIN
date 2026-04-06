import 'package:flutter/foundation.dart';

/// Backend base URL (scheme + host + path prefix), set at compile time.
///
/// **Debug / profile:** defaults to `http://10.0.2.2:3000/api/v1` (Android
/// emulator alias for the host). That works for many setups, including LDPlayer,
/// when the host is reachable. If you see timeouts, check the API is bound to
/// all interfaces (`0.0.0.0`), Windows Firewall for TCP 3000, or try your PC’s
/// LAN IP / `adb reverse tcp:3000 tcp:3000` with `http://127.0.0.1:3000/api/v1`.
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
