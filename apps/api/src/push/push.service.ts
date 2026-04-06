import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@/prisma/prisma.service';
import { AppSettingsService } from '@/app-settings/app-settings.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

/**
 * FCM abstraction: persists in-app notifications and push delivery based on runtime app settings.
 * Wire firebase-admin in production via FIREBASE_SERVICE_ACCOUNT_PATH.
 */
@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly settings: AppSettingsService,
    private readonly events: EventEmitter2,
  ) {}

  async notifyUser(
    userId: string,
    type: string,
    title: string,
    body: string,
    data?: Record<string, string>,
  ) {
    const [inAppEnabled, pushEnabled] = await Promise.all([
      this.settings.inAppNotificationsEnabled(),
      this.settings.pushNotificationsEnabled(),
    ]);

    if (inAppEnabled) {
      const notification = await this.prisma.notification.create({
        data: {
          userId,
          type,
          title,
          body,
          dataJson: data ? JSON.stringify(data) : undefined,
        },
      });
      this.events.emit('notification.created', {
        userId,
        notification: {
          id: notification.id,
          type: notification.type,
          title: notification.title,
          body: notification.body,
          isRead: notification.isRead,
          createdAt: notification.createdAt,
        },
      });
    }

    const fcmPath = this.config.get<string>('FIREBASE_SERVICE_ACCOUNT_PATH');
    if (!pushEnabled || !fcmPath) {
      this.logger.debug(`FCM skipped (no config): ${type} -> ${userId}`);
      return;
    }

    // Production: initialize firebase-admin once and send multicast to device tokens.
    this.logger.debug(`FCM placeholder: ${type} -> ${userId}`);
  }
}
