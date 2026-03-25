import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AdminService } from './admin.service';
import { AdminAuthController, AdminApiController } from './admin.controller';

@Module({
  imports: [JwtModule.register({})],
  controllers: [AdminAuthController, AdminApiController],
  providers: [AdminService],
})
export class AdminModule {}
