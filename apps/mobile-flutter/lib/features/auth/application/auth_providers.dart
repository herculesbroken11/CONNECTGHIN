import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_riverpod/legacy.dart';
import 'package:connectghin/core/network/dio_client.dart';
import 'package:connectghin/core/network/providers.dart';
import 'package:connectghin/features/auth/application/auth_session_controller.dart';
import 'package:connectghin/features/auth/data/auth_repository.dart';

final authSessionProvider = ChangeNotifierProvider<AuthSessionController>((ref) {
  return AuthSessionController(ref.watch(tokenStoreProvider));
});

/// Incremented after each successful silent token refresh (Dio interceptor).
/// Chat and other long-lived connections can listen and reconnect with the new JWT.
class AccessTokenRefreshNotifier extends Notifier<int> {
  @override
  int build() => 0;

  void bump() => state = state + 1;
}

final accessTokenRefreshSignalProvider =
    NotifierProvider<AccessTokenRefreshNotifier, int>(
  AccessTokenRefreshNotifier.new,
);

final dioProvider = Provider<Dio>((ref) {
  final tokens = ref.read(tokenStoreProvider);
  return createDio(
    tokens,
    onSessionExpired: () {
      ref.read(authSessionProvider).setAuthenticated(false);
    },
    onAccessTokenRefreshed: () {
      ref.read(accessTokenRefreshSignalProvider.notifier).bump();
    },
  );
});

final authRepositoryProvider = Provider<AuthRepository>((ref) {
  return AuthRepository(
    ref.watch(dioProvider),
    ref.watch(tokenStoreProvider),
  );
});
