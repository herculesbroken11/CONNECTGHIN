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
  }) async {
    final q = <String, dynamic>{};
    if (verifiedOnly) q['verifiedOnly'] = 'true';
    if (ageMin != null) q['ageMin'] = ageMin;
    if (ageMax != null) q['ageMax'] = ageMax;
    if (distanceKm != null) q['distance'] = distanceKm;
    final res = await _dio.get<Map<String, dynamic>>(
      'discovery/candidates',
      queryParameters: q,
    );
    return DiscoveryCandidatesPage.fromJson(
      Map<String, dynamic>.from(res.data ?? {}),
    ).items;
  }
}
