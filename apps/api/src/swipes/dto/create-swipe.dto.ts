import { IsEnum, IsUUID } from 'class-validator';
import { SwipeAction } from '@prisma/client';

export class CreateSwipeDto {
  @IsUUID()
  targetUserId: string;

  @IsEnum(SwipeAction)
  action: SwipeAction;
}
