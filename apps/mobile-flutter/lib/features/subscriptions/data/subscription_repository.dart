import 'package:dio/dio.dart';
import 'package:connectghin/features/subscriptions/domain/subscription_models.dart';

class SubscriptionRepository {
  SubscriptionRepository(this._dio);
  final Dio _dio;

  Future<SubscriptionMine> getMine() async {
    final res = await _dio.get<Map<String, dynamic>>('/subscriptions/me');
    return SubscriptionMine.fromJson(Map<String, dynamic>.from(res.data ?? {}));
  }

  Future<String?> createCheckoutUrl() async {
    final res = await _dio.post<Map<String, dynamic>>(
      '/subscriptions/checkout-session',
    );
    return res.data?['url'] as String?;
  }

  Future<String?> customerPortalUrl() async {
    final res = await _dio.post<Map<String, dynamic>>(
      '/subscriptions/customer-portal',
    );
    return res.data?['url'] as String?;
  }
}
