import { IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { MessageType } from '@prisma/client';

export class SendMessageDto {
  @IsString()
  @MinLength(1)
  @MaxLength(8000)
  body: string;

  @IsOptional()
  @IsEnum(MessageType)
  messageType?: MessageType;
}
