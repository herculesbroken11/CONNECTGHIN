/// Typed shapes for `/users/me`, `/profiles/:id`, and nested profile payloads.
library;

class ProfilePhoto {
  const ProfilePhoto({
    required this.id,
    required this.imageUrl,
    required this.sortOrder,
    required this.isPrimary,
  });

  final String id;
  final String imageUrl;
  final int sortOrder;
  final bool isPrimary;

  factory ProfilePhoto.fromJson(Map<String, dynamic> json) {
    return ProfilePhoto(
      id: json['id'] as String,
      imageUrl: json['imageUrl'] as String,
      sortOrder: (json['sortOrder'] as num?)?.toInt() ?? 0,
      isPrimary: json['isPrimary'] as bool? ?? false,
    );
  }
}

extension ProfilePhotoListX on List<ProfilePhoto> {
  /// Primary photo if set, otherwise first in list order from the API.
  ProfilePhoto? get primaryOrFirst {
    if (isEmpty) return null;
    for (final p in this) {
      if (p.isPrimary) return p;
    }
    return first;
  }
}

class UserProfile {
  const UserProfile({
    required this.id,
    required this.userId,
    required this.displayName,
    this.bio,
    this.age,
    this.city,
    this.locationLat,
    this.locationLng,
    this.handicap,
    this.drinkingPreference,
    this.smokingPreference,
    this.musicPreference,
    required this.profileCompletionPercent,
    required this.isGHINVerified,
    this.ghinVerificationRequestedAt,
    this.ghinVerificationRequestNote,
  });

  final String id;
  final String userId;
  final String displayName;
  final String? bio;
  final int? age;
  final String? city;
  final double? locationLat;
  final double? locationLng;
  final double? handicap;
  final String? drinkingPreference;
  final String? smokingPreference;
  final String? musicPreference;
  final int profileCompletionPercent;
  final bool isGHINVerified;
  final DateTime? ghinVerificationRequestedAt;
  final String? ghinVerificationRequestNote;

  factory UserProfile.fromJson(Map<String, dynamic>? json) {
    if (json == null) {
      throw ArgumentError('Profile JSON is null');
    }
    final reqAt = json['ghinVerificationRequestedAt'];
    return UserProfile(
      id: json['id'] as String,
      userId: json['userId'] as String,
      displayName: json['displayName'] as String? ?? '',
      bio: json['bio'] as String?,
      age: (json['age'] as num?)?.toInt(),
      city: json['city'] as String?,
      locationLat: (json['locationLat'] as num?)?.toDouble(),
      locationLng: (json['locationLng'] as num?)?.toDouble(),
      handicap: (json['handicap'] as num?)?.toDouble(),
      drinkingPreference: json['drinkingPreference'] as String?,
      smokingPreference: json['smokingPreference'] as String?,
      musicPreference: json['musicPreference'] as String?,
      profileCompletionPercent:
          (json['profileCompletionPercent'] as num?)?.toInt() ?? 0,
      isGHINVerified: json['isGHINVerified'] as bool? ?? false,
      ghinVerificationRequestedAt: reqAt == null
          ? null
          : DateTime.tryParse(reqAt.toString()),
      ghinVerificationRequestNote:
          json['ghinVerificationRequestNote'] as String?,
    );
  }

  static UserProfile? tryParse(Map<String, dynamic>? json) {
    if (json == null) return null;
    try {
      return UserProfile.fromJson(json);
    } catch (_) {
      return null;
    }
  }
}

/// Response from `GET /users/me` (UsersService — flat user + nested profile/photos).
class UserMe {
  const UserMe({
    required this.id,
    required this.email,
    required this.username,
    required this.firstName,
    required this.lastName,
    required this.membershipType,
    required this.membershipStatus,
    this.profile,
    required this.profilePhotos,
  });

  final String id;
  final String email;
  final String username;
  final String firstName;
  final String lastName;
  final String membershipType;
  final String membershipStatus;
  final UserProfile? profile;
  final List<ProfilePhoto> profilePhotos;

  static const int onboardingCompletionThreshold = 50;

  bool get needsProfileOnboarding =>
      (profile?.profileCompletionPercent ?? 0) < onboardingCompletionThreshold;

  factory UserMe.fromJson(Map<String, dynamic> json) {
    final photosRaw = json['profilePhotos'] as List<dynamic>? ?? [];
    return UserMe(
      id: json['id'] as String,
      email: json['email'] as String,
      username: json['username'] as String,
      firstName: json['firstName'] as String? ?? '',
      lastName: json['lastName'] as String? ?? '',
      membershipType: json['membershipType'] as String? ?? 'FREE',
      membershipStatus: json['membershipStatus'] as String? ?? 'NONE',
      profile: UserProfile.tryParse(
        json['profile'] as Map<String, dynamic>?,
      ),
      profilePhotos: photosRaw
          .map((e) => ProfilePhoto.fromJson(Map<String, dynamic>.from(e as Map)))
          .toList(),
    );
  }
}

/// `GET /profiles/:userId` when viewing another user.
class PublicProfile {
  const PublicProfile({
    required this.userId,
    required this.username,
    required this.profile,
    required this.photos,
  });

  final String userId;
  final String username;
  final UserProfile profile;
  final List<ProfilePhoto> photos;

  factory PublicProfile.fromJson(Map<String, dynamic> json) {
    final photosRaw = json['photos'] as List<dynamic>? ?? [];
    return PublicProfile(
      userId: json['userId'] as String,
      username: json['username'] as String,
      profile: UserProfile.fromJson(json['profile'] as Map<String, dynamic>),
      photos: photosRaw
          .map((e) => ProfilePhoto.fromJson(Map<String, dynamic>.from(e as Map)))
          .toList(),
    );
  }
}
