import 'package:connectghin/features/profile/domain/user_profile_models.dart';

class DiscoveryCandidate {
  const DiscoveryCandidate({
    required this.userId,
    this.username,
    this.profile,
    required this.photos,
  });

  final String userId;
  final String? username;
  final UserProfile? profile;
  final List<ProfilePhoto> photos;

  factory DiscoveryCandidate.fromJson(Map<String, dynamic> json) {
    final photosRaw = json['photos'] as List<dynamic>? ?? [];
    return DiscoveryCandidate(
      userId: json['userId'] as String,
      username: json['username'] as String?,
      profile: UserProfile.tryParse(json['profile'] as Map<String, dynamic>?),
      photos: photosRaw
          .map((e) => ProfilePhoto.fromJson(Map<String, dynamic>.from(e as Map)))
          .toList(),
    );
  }
}

class DiscoveryCandidatesPage {
  const DiscoveryCandidatesPage({required this.items});

  final List<DiscoveryCandidate> items;

  factory DiscoveryCandidatesPage.fromJson(Map<String, dynamic> json) {
    final raw = json['items'] as List<dynamic>? ?? [];
    return DiscoveryCandidatesPage(
      items: raw
          .map(
            (e) => DiscoveryCandidate.fromJson(
              Map<String, dynamic>.from(e as Map),
            ),
          )
          .toList(),
    );
  }
}
