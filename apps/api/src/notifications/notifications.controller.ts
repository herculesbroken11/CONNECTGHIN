import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { RegisterDeviceDto } from './dto/register-device.dto';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { JwtPayload } from '@/auth/types/jwt-payload.type';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  list(@CurrentUser() user: JwtPayload) {
    return this.notifications.list(user.sub);
  }

  @Patch(':id/read')
  read(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.notifications.markRead(user.sub, id);
  }
}

@Controller('devices')
export class DevicesController {
  constructor(private readonly notifications: NotificationsService) {}

  @Post('register-token')
  register(
    @CurrentUser() user: JwtPayload,
    @Body() dto: RegisterDeviceDto,
  ) {
    return this.notifications.registerToken(
      user.sub,
      dto.token,
      dto.platform,
    );
  }

  @Delete('register-token')
  remove(
    @CurrentUser() user: JwtPayload,
    @Query('token') token: string,
  ) {
    if (!token?.length) return { ok: true };
    return this.notifications.removeToken(user.sub, token);
  }
}
