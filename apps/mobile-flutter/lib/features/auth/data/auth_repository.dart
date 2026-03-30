import 'package:dio/dio.dart';
import 'package:connectghin/core/network/dio_client.dart';
import 'package:connectghin/features/auth/domain/auth_dtos.dart';

class AuthRepository {
  AuthRepository(this._dio, this._tokens);

  final Dio _dio;
  final TokenStore _tokens;

  Future<void> register(RegisterRequestDto dto) async {
    final res = await _dio.post<Map<String, dynamic>>(
      '/auth/register',
      data: dto.toJson(),
    );
    await _saveTokensFromResponse(res.data);
  }

  Future<void> login(LoginRequestDto dto) async {
    final res = await _dio.post<Map<String, dynamic>>(
      '/auth/login',
      data: dto.toJson(),
    );
    await _saveTokensFromResponse(res.data);
  }

  Future<void> forgotPassword(ForgotPasswordRequestDto dto) async {
    await _dio.post('/auth/forgot-password', data: dto.toJson());
  }

  Future<void> logout() async {
    try {
      await _dio.post('/auth/logout');
    } catch (_) {
      // Best effort on network/API errors.
    } finally {
      await _tokens.clear();
    }
  }

  Future<void> _saveTokensFromResponse(Map<String, dynamic>? data) async {
    if (data == null) throw StateError('Empty response');
    final access = data['accessToken'] as String?;
    final refresh = data['refreshToken'] as String?;
    if (access == null || refresh == null) {
      throw StateError('Missing tokens');
    }
    await _tokens.saveTokens(access: access, refresh: refresh);
  }
}
