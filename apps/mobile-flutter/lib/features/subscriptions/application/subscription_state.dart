import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:connectghin/core/util/api_error_message.dart';
import 'package:connectghin/features/app/data/app_repositories_provider.dart';
import 'package:connectghin/features/subscriptions/domain/subscription_models.dart';

class SubscriptionState {
  const SubscriptionState({
    this.loading = false,
    this.data,
    this.error,
  });

  final bool loading;
  final SubscriptionMine? data;
  final String? error;

  SubscriptionState copyWith({
    bool? loading,
    SubscriptionMine? data,
    String? error,
  }) {
    return SubscriptionState(
      loading: loading ?? this.loading,
      data: data ?? this.data,
      error: error,
    );
  }
}

class SubscriptionNotifier extends StateNotifier<SubscriptionState> {
  SubscriptionNotifier(this.ref) : super(const SubscriptionState());
  final Ref ref;

  Future<void> load() async {
    state = state.copyWith(loading: true, error: null);
    try {
      final m = await ref.read(subscriptionRepositoryProvider).getMine();
      state = state.copyWith(loading: false, data: m, error: null);
    } catch (e) {
      state = state.copyWith(loading: false, error: formatApiError(e));
    }
  }
}

final subscriptionStateProvider =
    StateNotifierProvider<SubscriptionNotifier, SubscriptionState>((ref) {
  return SubscriptionNotifier(ref);
});
