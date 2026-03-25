import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { SafetyService } from './safety.service';
import { CreateReportDto } from './dto/create-report.dto';
import { CreateBlockDto } from './dto/create-block.dto';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { JwtPayload } from '@/auth/types/jwt-payload.type';

@Controller('reports')
export class ReportsController {
  constructor(private readonly safety: SafetyService) {}

  @Post()
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateReportDto) {
    return this.safety.report(user.sub, dto);
  }
}

@Controller('blocks')
export class BlocksController {
  constructor(private readonly safety: SafetyService) {}

  @Post()
  block(@CurrentUser() user: JwtPayload, @Body() dto: CreateBlockDto) {
    return this.safety.block(user.sub, dto.blockedUserId);
  }

  @Delete(':blockedUserId')
  unblock(
    @CurrentUser() user: JwtPayload,
    @Param('blockedUserId', ParseUUIDPipe) blockedUserId: string,
  ) {
    return this.safety.unblock(user.sub, blockedUserId);
  }

  @Get()
  list(@CurrentUser() user: JwtPayload) {
    return this.safety.listBlocks(user.sub);
  }
}
