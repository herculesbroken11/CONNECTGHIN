import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:connectghin/core/config/app_env.dart';

const _kAccess = 'cg_access_token';
const _kRefresh = 'cg_refresh_token';

class TokenStore {
  TokenStore({FlutterSecureStorage? storage})
      : _storage = storage ?? const FlutterSecureStorage();

  final FlutterSecureStorage _storage;

  Future<String?> get access => _storage.read(key: _kAccess);
  Future<String?> get refresh => _storage.read(key: _kRefresh);

  Future<void> saveTokens({
    required String access,
    required String refresh,
  }) async {
    await _storage.write(key: _kAccess, value: access);
    await _storage.write(key: _kRefresh, value: refresh);
  }

  Future<void> clear() async {
    await _storage.delete(key: _kAccess);
    await _storage.delete(key: _kRefresh);
  }
}

final _refreshCoordinator = _RefreshCoordinator();

class _RefreshCoordinator {
  Future<bool>? _inFlight;

  Future<bool> run(Future<bool> Function() op) {
    if (_inFlight != null) return _inFlight!;
    _inFlight = op().whenComplete(() => _inFlight = null);
    return _inFlight!;
  }
}

bool _isPublicAuthPath(String path) {
  const suffixes = [
    '/auth/login',
    '/auth/register',
    '/auth/refresh',
    '/auth/forgot-password',
    '/auth/reset-password',
  ];
  for (final s in suffixes) {
    if (path == s || path.endsWith(s)) return true;
  }
  return false;
}

Future<bool> _tryRefresh(TokenStore tokens, Dio plain) async {
  final refresh = await tokens.refresh;
  if (refresh == null || refresh.isEmpty) return false;
  try {
    final res = await plain.post<Map<String, dynamic>>(
      '/auth/refresh',
      data: {'refreshToken': refresh},
    );
    final access = res.data?['accessToken'] as String?;
    final newRefresh = res.data?['refreshToken'] as String?;
    if (access == null || newRefresh == null) return false;
    await tokens.saveTokens(access: access, refresh: newRefresh);
    return true;
  } catch (_) {
    return false;
  }
}

Dio createDio(
  TokenStore tokens, {
  void Function()? onSessionExpired,
  void Function()? onAccessTokenRefreshed,
}) {
  final plain = Dio(
    BaseOptions(
      baseUrl: AppEnv.apiBaseUrl,
      connectTimeout: const Duration(seconds: 15),
      receiveTimeout: const Duration(seconds: 30),
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    ),
  );

  final dio = Dio(
    BaseOptions(
      baseUrl: AppEnv.apiBaseUrl,
      connectTimeout: const Duration(seconds: 15),
      receiveTimeout: const Duration(seconds: 30),
      headers: {'Accept': 'application/json'},
    ),
  );

  dio.interceptors.add(
    InterceptorsWrapper(
      onRequest: (options, handler) async {
        final t = await tokens.access;
        if (t != null && t.isNotEmpty) {
          options.headers['Authorization'] = 'Bearer $t';
        }
        return handler.next(options);
      },
      onError: (err, handler) async {
        if (err.response?.statusCode != 401) {
          return handler.next(err);
        }
        final path = err.requestOptions.path;
        if (_isPublicAuthPath(path)) {
          return handler.next(err);
        }

        final ro = err.requestOptions;
        if (ro.extra['_retried'] == true) {
          await tokens.clear();
          onSessionExpired?.call();
          return handler.next(err);
        }

        final refreshed =
            await _refreshCoordinator.run(() => _tryRefresh(tokens, plain));
        if (!refreshed) {
          await tokens.clear();
          onSessionExpired?.call();
          return handler.next(err);
        }

        onAccessTokenRefreshed?.call();

        final access = await tokens.access;
        if (access == null || access.isEmpty) {
          await tokens.clear();
          onSessionExpired?.call();
          return handler.next(err);
        }

        ro.headers['Authorization'] = 'Bearer $access';
        ro.extra['_retried'] = true;
        try {
          final clone = await dio.fetch(ro);
          return handler.resolve(clone);
        } catch (e) {
          return handler.next(
            e is DioException ? e : DioException(requestOptions: ro, error: e),
          );
        }
      },
    ),
  );

  return dio;
}
