import 'package:dio/dio.dart';

/// `GET config/public` — no auth required; used for limits & feature flags.
class PublicConfigRepository {
  PublicConfigRepository(this._dio);
  final Dio _dio;

  Future<PublicAppConfig> fetch() async {
    final res = await _dio.get<Map<String, dynamic>>('config/public');
    return PublicAppConfig.fromJson(Map<String, dynamic>.from(res.data ?? {}));
  }
}

class PublicAppConfig {
  const PublicAppConfig({
    required this.freeDailySwipeLimit,
    required this.freeDailySwipeLimitEnabled,
    required this.premiumDirectMessagingEnabled,
    required this.premiumTrialingFeaturesEnabled,
  });

  final int freeDailySwipeLimit;
  final bool freeDailySwipeLimitEnabled;
  final bool premiumDirectMessagingEnabled;
  final bool premiumTrialingFeaturesEnabled;

  factory PublicAppConfig.fromJson(Map<String, dynamic> json) {
    final raw = json['settings'];
    final map = raw is Map
        ? Map<String, dynamic>.from(raw)
        : <String, dynamic>{};

    int n(String key, int fallback) {
      final v = map[key];
      if (v is num) return v.toInt();
      return fallback;
    }

    bool b(String key, bool fallback) {
      final v = map[key];
      if (v is bool) return v;
      return fallback;
    }

    return PublicAppConfig(
      freeDailySwipeLimit: n('free_daily_swipe_limit', 10),
      freeDailySwipeLimitEnabled: b('free_daily_swipe_limit_enabled', true),
      premiumDirectMessagingEnabled: b('premium_direct_messaging_enabled', false),
      premiumTrialingFeaturesEnabled: b('premium_trialing_features_enabled', true),
    );
  }
}
