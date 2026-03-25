import { Controller, Delete, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { MatchesService } from './matches.service';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { JwtPayload } from '@/auth/types/jwt-payload.type';

@Controller('matches')
export class MatchesController {
  constructor(private readonly matches: MatchesService) {}

  @Get()
  list(@CurrentUser() user: JwtPayload) {
    return this.matches.list(user.sub);
  }

  @Get(':matchId')
  getOne(
    @CurrentUser() user: JwtPayload,
    @Param('matchId', ParseUUIDPipe) matchId: string,
  ) {
    return this.matches.getOne(user.sub, matchId);
  }

  @Delete(':matchId')
  remove(
    @CurrentUser() user: JwtPayload,
    @Param('matchId', ParseUUIDPipe) matchId: string,
  ) {
    return this.matches.unmatch(user.sub, matchId);
  }
}
