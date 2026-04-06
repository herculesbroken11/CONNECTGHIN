import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { NotificationsService } from './notifications.service';
import {
  NotificationsController,
  DevicesController,
} from './notifications.controller';
import { NotificationsGateway } from './notifications.gateway';

@Module({
  imports: [JwtModule.register({})],
  controllers: [NotificationsController, DevicesController],
  providers: [NotificationsService, NotificationsGateway],
})
export class NotificationsModule {}
