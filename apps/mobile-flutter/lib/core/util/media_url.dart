import 'package:connectghin/core/config/app_env.dart';

/// Turns `/uploads/...` into a full URL using the API host.
String resolveMediaUrl(String url) {
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  final u = Uri.parse(AppEnv.apiBaseUrl);
  final port = u.hasPort ? ':${u.port}' : '';
  final origin = '${u.scheme}://${u.host}$port';
  return '$origin$url';
}
