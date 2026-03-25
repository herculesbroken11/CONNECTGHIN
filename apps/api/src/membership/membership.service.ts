import { Injectable } from '@nestjs/common';
import {
  MembershipStatus,
  MembershipType,
  User,
} from '@prisma/client';
import { AppSettingsService } from '@/app-settings/app-settings.service';

@Injectable()
export class MembershipService {
  constructor(private readonly settings: AppSettingsService) {}

  /** Effective premium: PREMIUM type + (ACTIVE or TRIALING if setting allows). */
  async isPremiumEffective(user: Pick<User, 'membershipType' | 'membershipStatus'>): Promise<boolean> {
    if (user.membershipType !== MembershipType.PREMIUM) return false;
    if (user.membershipStatus === MembershipStatus.ACTIVE) return true;
    if (user.membershipStatus === MembershipStatus.TRIALING) {
      return this.settings.premiumTrialingFeaturesEnabled();
    }
    return false;
  }

  isFree(user: Pick<User, 'membershipType'>): boolean {
    return user.membershipType !== MembershipType.PREMIUM;
  }
}
