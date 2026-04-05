import 'package:connectghin/features/profile/domain/user_profile_models.dart';

/// One row from `GET /matches` `items[]`.
class MatchListItem {
  const MatchListItem({
    required this.matchId,
    required this.matchedAt,
    this.otherUser,
  });

  final String matchId;
  final DateTime matchedAt;
  final MatchOtherUser? otherUser;

  factory MatchListItem.fromJson(Map<String, dynamic> json) {
    final userJson = json['user'];
    return MatchListItem(
      matchId: json['matchId'] as String,
      matchedAt: DateTime.parse(json['matchedAt'].toString()).toLocal(),
      otherUser: userJson is Map
          ? MatchOtherUser.fromJson(Map<String, dynamic>.from(userJson))
          : null,
    );
  }
}

class MatchOtherUser {
  const MatchOtherUser({
    required this.id,
    required this.username,
    this.profile,
    this.primaryPhoto,
  });

  final String id;
  final String username;
  final UserProfile? profile;
  final ProfilePhoto? primaryPhoto;

  factory MatchOtherUser.fromJson(Map<String, dynamic> json) {
    final photo = json['primaryPhoto'];
    return MatchOtherUser(
      id: json['id'] as String,
      username: json['username'] as String? ?? '',
      profile: UserProfile.tryParse(json['profile'] as Map<String, dynamic>?),
      primaryPhoto: photo is Map
          ? ProfilePhoto.fromJson(Map<String, dynamic>.from(photo))
          : null,
    );
  }
}
