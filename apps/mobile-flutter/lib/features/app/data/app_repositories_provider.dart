import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:connectghin/features/auth/application/auth_providers.dart';
import 'package:connectghin/features/discovery/data/discovery_repository.dart';
import 'package:connectghin/features/ghinder/data/swipes_repository.dart';
import 'package:connectghin/features/matches/data/matches_repository.dart';
import 'package:connectghin/features/messaging/data/messaging_repository.dart';
import 'package:connectghin/features/profile/data/profile_repository.dart';
import 'package:connectghin/features/subscriptions/data/subscription_repository.dart';
import 'package:connectghin/features/safety/data/safety_repository.dart';

final discoveryRepositoryProvider = Provider((ref) {
  return DiscoveryRepository(ref.watch(dioProvider));
});

final swipesRepositoryProvider = Provider((ref) {
  return SwipesRepository(ref.watch(dioProvider));
});

final matchesRepositoryProvider = Provider((ref) {
  return MatchesRepository(ref.watch(dioProvider));
});

final messagingRepositoryProvider = Provider((ref) {
  return MessagingRepository(ref.watch(dioProvider));
});

final profileRepositoryProvider = Provider((ref) {
  return ProfileRepository(ref.watch(dioProvider));
});

final subscriptionRepositoryProvider = Provider((ref) {
  return SubscriptionRepository(ref.watch(dioProvider));
});

final safetyRepositoryProvider = Provider((ref) {
  return SafetyRepository(ref.watch(dioProvider));
});
