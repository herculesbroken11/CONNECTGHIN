import 'package:dio/dio.dart';
import 'package:connectghin/features/profile/domain/user_profile_models.dart';

class ProfileRepository {
  ProfileRepository(this._dio);
  final Dio _dio;

  Future<UserMe> getMe() async {
    final res = await _dio.get<Map<String, dynamic>>('users/me');
    return UserMe.fromJson(Map<String, dynamic>.from(res.data ?? {}));
  }

  Future<PublicProfile> getProfile(String userId) async {
    final res = await _dio.get<Map<String, dynamic>>('profiles/$userId');
    return PublicProfile.fromJson(Map<String, dynamic>.from(res.data ?? {}));
  }

  Future<UserProfile> updateProfile(Map<String, dynamic> patch) async {
    final res = await _dio.patch<Map<String, dynamic>>('profiles/me', data: patch);
    return UserProfile.fromJson(Map<String, dynamic>.from(res.data ?? {}));
  }

  Future<ProfilePhoto> uploadPhoto(List<int> bytes, String filename) async {
    final form = FormData.fromMap({
      'file': MultipartFile.fromBytes(bytes, filename: filename),
    });
    final res = await _dio.post<Map<String, dynamic>>(
      'profiles/me/photos',
      data: form,
    );
    return ProfilePhoto.fromJson(Map<String, dynamic>.from(res.data ?? {}));
  }
}
