import 'package:dio/dio.dart';

class SwipesRepository {
  SwipesRepository(this._dio);
  final Dio _dio;

  Future<Map<String, dynamic>> swipe({
    required String targetUserId,
    required String action,
  }) async {
    final res = await _dio.post<Map<String, dynamic>>(
      '/swipes',
      data: {'targetUserId': targetUserId, 'action': action},
    );
    return res.data ?? {};
  }
}
