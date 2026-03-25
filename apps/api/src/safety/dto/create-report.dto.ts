import { IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class CreateReportDto {
  @IsUUID()
  targetUserId: string;

  @IsString()
  @MinLength(3)
  @MaxLength(200)
  reason: string;

  @IsString()
  @MaxLength(4000)
  details?: string;
}
