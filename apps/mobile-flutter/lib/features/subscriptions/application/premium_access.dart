import 'package:connectghin/features/profile/domain/user_profile_models.dart';

/// Matches API [MembershipService.isPremiumEffective] (simplified: no async settings).
bool isPremiumUser(UserMe me) {
  final t = me.membershipType.toUpperCase();
  final st = me.membershipStatus.toUpperCase();
  if (t != 'PREMIUM') return false;
  if (st == 'ACTIVE') return true;
  if (st == 'TRIALING') return true;
  return false;
}
