import {
  Allow,
  IsBoolean,
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { SavedFilterView } from '@prisma/client';

export class CreateSavedFilterDto {
  @IsEnum(SavedFilterView)
  view!: SavedFilterView;

  @IsString()
  @MinLength(1)
  @MaxLength(80)
  name!: string;

  @IsObject()
  @Allow()
  filters!: Record<string, unknown>;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

export class UpdateSavedFilterDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  name?: string;

  @IsOptional()
  @IsObject()
  @Allow()
  filters?: Record<string, unknown>;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
