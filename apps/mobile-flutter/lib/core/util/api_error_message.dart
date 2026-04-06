import 'package:dio/dio.dart';
import 'package:connectghin/core/config/app_env.dart';

String formatApiError(Object error) {
  if (error is DioException) {
    switch (error.type) {
      case DioExceptionType.connectionTimeout:
      case DioExceptionType.sendTimeout:
      case DioExceptionType.receiveTimeout:
        return 'Could not reach the API at ${AppEnv.apiBaseUrl} (timed out). '
            'Start the backend (e.g. npm run api:dev) and allow port 3000 through Windows Firewall. '
            'On Android emulators (including LDPlayer), the host machine is http://10.0.2.2:3000 — '
            'do not use localhost from the app. If it still fails, try your PC’s LAN IP with --dart-define=API_BASE_URL=...';
      case DioExceptionType.connectionError:
        return 'No route to the API at ${AppEnv.apiBaseUrl}. '
            'Check the URL and that the server is running.';
      default:
        break;
    }
    final data = error.response?.data;
    if (data is Map) {
      final msg = data['message'];
      if (msg is String && msg.isNotEmpty) return msg;
      if (msg is List && msg.isNotEmpty) {
        return msg.map((e) => e.toString()).join(', ');
      }
    }
    if (error.message != null && error.message!.isNotEmpty) {
      return error.message!;
    }
  }
  return error.toString();
}
