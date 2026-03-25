import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import {
  NotificationsController,
  DevicesController,
} from './notifications.controller';

@Module({
  controllers: [NotificationsController, DevicesController],
  providers: [NotificationsService],
})
export class NotificationsModule {}
