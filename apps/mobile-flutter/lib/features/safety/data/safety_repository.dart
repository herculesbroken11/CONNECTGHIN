import 'package:dio/dio.dart';

class SafetyRepository {
  SafetyRepository(this._dio);
  final Dio _dio;

  Future<void> reportUser({
    required String targetUserId,
    required String reason,
    String? details,
  }) async {
    await _dio.post('reports', data: {
      'targetUserId': targetUserId,
      'reason': reason,
      if (details != null) 'details': details,
    });
  }

  Future<void> blockUser(String blockedUserId) async {
    await _dio.post('blocks', data: {'blockedUserId': blockedUserId});
  }

  Future<List<Map<String, dynamic>>> listBlocks() async {
    final res = await _dio.get<Map<String, dynamic>>('blocks');
    final items = res.data?['items'] as List<dynamic>? ?? [];
    return items.map((e) => Map<String, dynamic>.from(e as Map)).toList();
  }

  Future<void> unblock(String blockedUserId) async {
    await _dio.delete('blocks/$blockedUserId');
  }
}
