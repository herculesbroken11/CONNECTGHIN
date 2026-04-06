import 'package:dio/dio.dart';
import 'package:connectghin/core/config/app_env.dart';

String formatApiError(Object error) {
  if (error is DioException) {
    switch (error.type) {
      case DioExceptionType.connectionTimeout:
      case DioExceptionType.sendTimeout:
      case DioExceptionType.receiveTimeout:
        return 'Could not reach the API at ${AppEnv.apiBaseUrl} (timed out). '
            'Start the backend (npm run api:dev), confirm it listens on 0.0.0.0:3000, '
            'and allow TCP 3000 on Windows Firewall (Private). '
            'If 10.0.2.2 still fails: try your PC LAN IP in --dart-define=API_BASE_URL=..., '
            'or adb reverse tcp:3000 tcp:3000 with http://127.0.0.1:3000/api/v1.';
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
