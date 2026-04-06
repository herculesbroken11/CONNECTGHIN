import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';

const KEYS = {
  FREE_DAILY_SWIPE_LIMIT: 'free_daily_swipe_limit',
  FREE_DAILY_SWIPE_LIMIT_ENABLED: 'free_daily_swipe_limit_enabled',
  PREMIUM_DIRECT_MESSAGING: 'premium_direct_messaging_enabled',
  PREMIUM_TRIALING_FEATURES: 'premium_trialing_features_enabled',
  IN_APP_NOTIFICATIONS_ENABLED: 'in_app_notifications_enabled',
  PUSH_NOTIFICATIONS_ENABLED: 'push_notifications_enabled',
  TRIAL_DAYS: 'trial_days',
} as const;

@Injectable()
export class AppSettingsService {
  private cache = new Map<string, unknown>();
  private cacheAt = 0;
  private readonly ttlMs = 30_000;

  constructor(private readonly prisma: PrismaService) {}

  async getNumber(key: string, fallback: number): Promise<number> {
    const row = await this.getRow(key);
    if (!row) return fallback;
    try {
      const v = JSON.parse(row.valueJson) as unknown;
      return typeof v === 'number' ? v : fallback;
    } catch {
      return fallback;
    }
  }

  async getBoolean(key: string, fallback: boolean): Promise<boolean> {
    const row = await this.getRow(key);
    if (!row) return fallback;
    try {
      const v = JSON.parse(row.valueJson) as unknown;
      return typeof v === 'boolean' ? v : fallback;
    } catch {
      return fallback;
    }
  }

  async setJson(key: string, value: unknown) {
    await this.prisma.appSettings.upsert({
      where: { key },
      create: { key, valueJson: JSON.stringify(value) },
      update: { valueJson: JSON.stringify(value) },
    });
    this.cache.clear();
  }

  async freeDailySwipeLimit(): Promise<number> {
    return this.getNumber(KEYS.FREE_DAILY_SWIPE_LIMIT, 10);
  }

  async freeDailySwipeLimitEnabled(): Promise<boolean> {
    return this.getBoolean(KEYS.FREE_DAILY_SWIPE_LIMIT_ENABLED, true);
  }

  async premiumDirectMessagingEnabled(): Promise<boolean> {
    return this.getBoolean(KEYS.PREMIUM_DIRECT_MESSAGING, false);
  }

  async premiumTrialingFeaturesEnabled(): Promise<boolean> {
    return this.getBoolean(KEYS.PREMIUM_TRIALING_FEATURES, true);
  }

  async inAppNotificationsEnabled(): Promise<boolean> {
    return this.getBoolean(KEYS.IN_APP_NOTIFICATIONS_ENABLED, true);
  }

  async pushNotificationsEnabled(): Promise<boolean> {
    return this.getBoolean(KEYS.PUSH_NOTIFICATIONS_ENABLED, true);
  }

  async trialDays(): Promise<number> {
    return this.getNumber(KEYS.TRIAL_DAYS, 7);
  }

  async allPublic(): Promise<Record<string, unknown>> {
    const rows = await this.prisma.appSettings.findMany();
    const out: Record<string, unknown> = {};
    for (const r of rows) {
      try {
        out[r.key] = JSON.parse(r.valueJson) as unknown;
      } catch {
        out[r.key] = r.valueJson;
      }
    }
    return out;
  }

  private async getRow(key: string) {
    const now = Date.now();
    if (now - this.cacheAt > this.ttlMs) {
      this.cache.clear();
      this.cacheAt = now;
    }
    if (this.cache.has(key)) {
      return this.cache.get(key) as { valueJson: string } | null;
    }
    const row = await this.prisma.appSettings.findUnique({ where: { key } });
    this.cache.set(key, row);
    return row;
  }
}
