import 'package:dio/dio.dart';
import 'package:connectghin/features/matches/domain/match_models.dart';

class MatchesRepository {
  MatchesRepository(this._dio);
  final Dio _dio;

  Future<List<MatchListItem>> listMatches() async {
    final res = await _dio.get<Map<String, dynamic>>('matches');
    final items = res.data?['items'] as List<dynamic>? ?? [];
    return items
        .map(
          (e) => MatchListItem.fromJson(Map<String, dynamic>.from(e as Map)),
        )
        .toList();
  }
}
