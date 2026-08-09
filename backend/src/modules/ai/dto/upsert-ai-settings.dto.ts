import { Transform } from 'class-transformer';
import { AiProvider } from '@prisma/client';
import {
  IsBoolean,
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

  @IsOptional()
  @IsEnum(AiProvider)
  embeddingProvider?: AiProvider;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @ValidateIf((o: UpsertAiSettingsDto) => o.embeddingProvider === AiProvider.CUSTOM)
  @IsString()
  @IsNotEmpty({ message: 'Для embedding CUSTOM укажите base URL' })
  @MaxLength(512)
  embeddingBaseUrl?: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsOptional()
  @IsString()
  @MaxLength(120)
  embeddingModel?: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsOptional()
  @IsString()
  @MinLength(8)
  @MaxLength(512)
  embeddingApiToken?: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    if (value === true || value === 'true' || value === 1 || value === '1') return true;
    if (value === false || value === 'false' || value === 0 || value === '0') return false;
    return value;
  })
  @IsBoolean()
  clearEmbedding?: boolean;
}
