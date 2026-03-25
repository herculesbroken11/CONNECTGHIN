import 'package:connectghin/core/config/app_env.dart';

/// Socket.IO namespace URL for chat (same host as API, `/chat` namespace).
String chatSocketUrl() {
  final u = Uri.parse(AppEnv.apiBaseUrl);
  final port = u.hasPort ? ':${u.port}' : '';
  return '${u.scheme}://${u.host}$port/chat';
}
