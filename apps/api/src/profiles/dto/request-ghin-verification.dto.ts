import { IsOptional, IsString, MaxLength } from 'class-validator';

export class RequestGhinVerificationDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
