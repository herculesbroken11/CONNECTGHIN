import { Module } from '@nestjs/common';
import { SafetyService } from './safety.service';
import { ReportsController, BlocksController } from './safety.controller';

@Module({
  controllers: [ReportsController, BlocksController],
  providers: [SafetyService],
})
export class SafetyModule {}
