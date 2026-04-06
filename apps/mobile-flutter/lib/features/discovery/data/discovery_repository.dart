import 'package:dio/dio.dart';
import 'package:connectghin/features/discovery/domain/discovery_candidate.dart';

class DiscoveryRepository {
  DiscoveryRepository(this._dio);
  final Dio _dio;

  Future<List<DiscoveryCandidate>> fetchCandidates({
    bool verifiedOnly = false,
    int? ageMin,
    int? ageMax,
    double? distanceKm,
    double? handicapMin,
    double? handicapMax,
    String? drinkingPreference,
    String? smokingPreference,
    String? musicPreference,
    int limit = 20,
  }) async {
    final q = <String, dynamic>{'limit': limit};
    if (verifiedOnly) q['verifiedOnly'] = 'true';
    if (ageMin != null) q['ageMin'] = ageMin;
    if (ageMax != null) q['ageMax'] = ageMax;
    if (distanceKm != null) q['distance'] = distanceKm;
    if (handicapMin != null) q['handicapMin'] = handicapMin;
    if (handicapMax != null) q['handicapMax'] = handicapMax;
    if (drinkingPreference != null && drinkingPreference.isNotEmpty) {
      q['drinkingPreference'] = drinkingPreference;
    }
    if (smokingPreference != null && smokingPreference.isNotEmpty) {
      q['smokingPreference'] = smokingPreference;
    }
    if (musicPreference != null && musicPreference.isNotEmpty) {
      q['musicPreference'] = musicPreference;
    }
    final res = await _dio.get<Map<String, dynamic>>(
      'discovery/candidates',
      queryParameters: q,
    );
    return DiscoveryCandidatesPage.fromJson(
      Map<String, dynamic>.from(res.data ?? {}),
    ).items;
  }
}
