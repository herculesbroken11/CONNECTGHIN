import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@/prisma/prisma.service';

/**
 * FCM abstraction: persists in-app notifications always; push when configured.
 * Wire firebase-admin in production via FIREBASE_SERVICE_ACCOUNT_PATH.
 */
@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async notifyUser(
    userId: string,
    type: string,
    title: string,
    body: string,
    data?: Record<string, string>,
  ) {
    await this.prisma.notification.create({
      data: {
        userId,
        type,
        title,
        body,
        dataJson: data ? JSON.stringify(data) : undefined,
      },
    });

    const fcmPath = this.config.get<string>('FIREBASE_SERVICE_ACCOUNT_PATH');
    if (!fcmPath) {
      this.logger.debug(`FCM skipped (no config): ${type} -> ${userId}`);
      return;
    }

    // Production: initialize firebase-admin once and send multicast to device tokens.
    this.logger.debug(`FCM placeholder: ${type} -> ${userId}`);
  }
}
