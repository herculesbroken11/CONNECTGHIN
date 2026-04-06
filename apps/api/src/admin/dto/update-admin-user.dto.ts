import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { MembershipType, UserRole } from '@prisma/client';

class UpdateAdminUserProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  displayName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  age?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  handicap?: number;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  city?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  state?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  country?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  drinkingPreference?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  smokingPreference?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  musicPreference?: string;
}

export class UpdateAdminUserDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  firstName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  lastName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  username?: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsOptional()
  @IsEnum(MembershipType)
  membershipType?: MembershipType;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  isSuspended?: boolean;

  @IsOptional()
  @IsObject()
  profile?: UpdateAdminUserProfileDto;
}
