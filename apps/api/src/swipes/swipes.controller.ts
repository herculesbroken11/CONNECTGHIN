import { Body, Controller, Post } from '@nestjs/common';
import { SwipesService } from './swipes.service';
import { CreateSwipeDto } from './dto/create-swipe.dto';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { JwtPayload } from '@/auth/types/jwt-payload.type';

@Controller('swipes')
export class SwipesController {
  constructor(private readonly swipes: SwipesService) {}

  @Post()
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateSwipeDto) {
    return this.swipes.create(user.sub, dto);
  }
}
