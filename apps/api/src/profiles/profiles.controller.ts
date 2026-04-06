import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ProfilesService } from './profiles.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { RequestGhinVerificationDto } from './dto/request-ghin-verification.dto';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { JwtPayload } from '@/auth/types/jwt-payload.type';

@Controller('profiles')
export class ProfilesController {
  constructor(private readonly profiles: ProfilesService) {}

  @Get(':userId')
  getOne(
    @CurrentUser() user: JwtPayload,
    @Param('userId', ParseUUIDPipe) userId: string,
  ) {
    return this.profiles.getPublicProfile(user.sub, userId);
  }

  @Patch('me')
  patchMe(@CurrentUser() user: JwtPayload, @Body() dto: UpdateProfileDto) {
    return this.profiles.updateMine(user.sub, dto);
  }

  @Post('me/request-ghin-verification')
  requestGhinVerification(
    @CurrentUser() user: JwtPayload,
    @Body() dto: RequestGhinVerificationDto,
  ) {
    return this.profiles.requestGhinVerification(user.sub, dto);
  }

  @Post('me/photos')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  addPhoto(
    @CurrentUser() user: JwtPayload,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.profiles.addPhoto(user.sub, file);
  }

  @Delete('me/photos/:photoId')
  deletePhoto(
    @CurrentUser() user: JwtPayload,
    @Param('photoId', ParseUUIDPipe) photoId: string,
  ) {
    return this.profiles.deletePhoto(user.sub, photoId);
  }

  @Patch('me/photos/:photoId/primary')
  setPrimary(
    @CurrentUser() user: JwtPayload,
    @Param('photoId', ParseUUIDPipe) photoId: string,
  ) {
    return this.profiles.setPrimary(user.sub, photoId);
  }
}
