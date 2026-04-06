import 'package:dio/dio.dart';
import 'package:connectghin/features/notifications/domain/app_notification.dart'
    show InAppNotification;

class NotificationsRepository {
  NotificationsRepository(this._dio);
  final Dio _dio;

  Future<List<InAppNotification>> list({String status = 'all'}) async {
    final res = await _dio.get<Map<String, dynamic>>(
      'notifications',
      queryParameters: {'status': status},
    );
    final raw = res.data?['items'] as List<dynamic>? ?? [];
    return raw
        .map((e) => InAppNotification.fromJson(Map<String, dynamic>.from(e as Map)))
        .toList();
  }

  Future<int> unreadCount() async {
    final res = await _dio.get<Map<String, dynamic>>('notifications/unread-count');
    return (res.data?['count'] as num?)?.toInt() ?? 0;
  }

  Future<void> markRead(String id) async {
    await _dio.patch('notifications/$id/read');
  }

  Future<void> markAllRead() async {
    await _dio.patch('notifications/read-all');
  }
}
