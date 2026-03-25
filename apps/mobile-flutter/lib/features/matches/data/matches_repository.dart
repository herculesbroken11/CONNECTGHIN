import 'package:dio/dio.dart';

class MatchesRepository {
  MatchesRepository(this._dio);
  final Dio _dio;

  Future<List<Map<String, dynamic>>> listMatches() async {
    final res = await _dio.get<Map<String, dynamic>>('/matches');
    final items = res.data?['items'] as List<dynamic>? ?? [];
    return items.map((e) => Map<String, dynamic>.from(e as Map)).toList();
  }
}
