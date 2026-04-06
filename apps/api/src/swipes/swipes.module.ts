import { Module } from '@nestjs/common';
import { PushModule } from '@/push/push.module';
import { SwipesService } from './swipes.service';
import { SwipesController } from './swipes.controller';

@Module({
  imports: [PushModule],
  controllers: [SwipesController],
  providers: [SwipesService],
})
export class SwipesModule {}
