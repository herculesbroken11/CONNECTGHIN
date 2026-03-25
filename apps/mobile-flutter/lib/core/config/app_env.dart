/// Compile-time API base URL; override with `--dart-define=API_BASE_URL=...`
class AppEnv {
  static const String apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://10.0.2.2:3000/api/v1',
  );
}
