import { Transform } from 'class-transformer';
import { AiProvider } from '@prisma/client';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';

export class UpsertAiSettingsDto {
  @IsEnum(AiProvider)
  provider!: AiProvider;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @ValidateIf((o: UpsertAiSettingsDto) => o.provider === AiProvider.CUSTOM)
  @IsString()
  @IsNotEmpty({ message: 'Для CUSTOM укажите base URL' })
  @MaxLength(512)
  baseUrl?: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsOptional()
  @IsString()
  @MaxLength(120)
  model?: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(512)
  apiToken!: string;
}
