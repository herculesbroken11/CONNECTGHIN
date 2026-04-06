import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class DiscoveryQueryDto {
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  verifiedOnly?: boolean;

  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @Min(18)
  @Max(120)
  ageMin?: number;

  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @Min(18)
  @Max(120)
  ageMax?: number;

  /** Kilometers from current user (requires your profile lat/lng). */
  @IsOptional()
  @Transform(({ value }) => parseFloat(value))
  @Min(1)
  @Max(500)
  distance?: number;

  /** Inclusive; candidates without a handicap are excluded when either bound is set. */
  @IsOptional()
  @IsNumber()
  @Min(-10)
  @Max(60)
  handicapMin?: number;

  @IsOptional()
  @IsNumber()
  @Min(-10)
  @Max(60)
  handicapMax?: number;

  @IsOptional()
  @IsString()
  drinkingPreference?: string;

  @IsOptional()
  @IsString()
  smokingPreference?: string;

  @IsOptional()
  @IsString()
  musicPreference?: string;

  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;
}
