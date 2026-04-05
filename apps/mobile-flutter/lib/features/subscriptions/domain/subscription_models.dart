/// Typed `GET /subscriptions/me` payload.
class MembershipSummary {
  const MembershipSummary({
    required this.membershipType,
    required this.membershipStatus,
  });

  final String membershipType;
  final String membershipStatus;

  factory MembershipSummary.fromJson(Object? json) {
    if (json is! Map) {
      return const MembershipSummary(
        membershipType: 'FREE',
        membershipStatus: 'NONE',
      );
    }
    final m = Map<String, dynamic>.from(json);
    return MembershipSummary(
      membershipType: m['membershipType'] as String? ?? 'FREE',
      membershipStatus: m['membershipStatus'] as String? ?? 'NONE',
    );
  }
}

class SubscriptionRecordSummary {
  const SubscriptionRecordSummary({
    this.status,
    this.planCode,
    this.stripeSubscriptionId,
  });

  final String? status;
  final String? planCode;
  final String? stripeSubscriptionId;

  factory SubscriptionRecordSummary.fromJson(Object? json) {
    if (json is! Map) return const SubscriptionRecordSummary();
    final m = Map<String, dynamic>.from(json);
    return SubscriptionRecordSummary(
      status: m['status'] as String?,
      planCode: m['planCode'] as String?,
      stripeSubscriptionId: m['stripeSubscriptionId'] as String?,
    );
  }
}

class SubscriptionMine {
  const SubscriptionMine({
    required this.membership,
    this.subscription,
  });

  final MembershipSummary membership;
  final SubscriptionRecordSummary? subscription;

  factory SubscriptionMine.fromJson(Map<String, dynamic> json) {
    return SubscriptionMine(
      membership: MembershipSummary.fromJson(json['membership']),
      subscription: json['subscription'] != null
          ? SubscriptionRecordSummary.fromJson(json['subscription'])
          : null,
    );
  }
}
