import {
  IsOptional,
  IsString,
  IsInt,
  Min,
  Max,
  IsNumber,
  IsArray,
  MaxLength,
} from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  displayName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  bio?: string;

  @IsOptional()
  @IsInt()
  @Min(18)
  @Max(120)
  age?: number;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  gender?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  interestedIn?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  city?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  state?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  country?: string;

  @IsOptional()
  @IsNumber()
  locationLat?: number;

  @IsOptional()
  @IsNumber()
  locationLng?: number;

  @IsOptional()
  @IsNumber()
  handicap?: number;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  golfHomeCourse?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  favoriteCourses?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(80)
  drinkingPreference?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  smokingPreference?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  musicPreference?: string;
}
