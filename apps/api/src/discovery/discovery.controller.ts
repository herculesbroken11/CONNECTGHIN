import { Controller, Get, Query } from '@nestjs/common';
import { DiscoveryService } from './discovery.service';
import { DiscoveryQueryDto } from './dto/discovery-query.dto';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { JwtPayload } from '@/auth/types/jwt-payload.type';

@Controller('discovery')
export class DiscoveryController {
  constructor(private readonly discovery: DiscoveryService) {}

  @Get('candidates')
  candidates(
    @CurrentUser() user: JwtPayload,
    @Query() query: DiscoveryQueryDto,
  ) {
    return this.discovery.candidates(user.sub, query);
  }
}
