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
  @IsEnum(AiProvider, { message: 'Укажите корректного AI-провайдера' })
  provider!: AiProvider;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @ValidateIf((o: UpsertAiSettingsDto) => o.provider === AiProvider.CUSTOM)
  @IsString({ message: 'Адрес API должен быть строкой' })
  @IsNotEmpty({ message: 'Для CUSTOM укажите адрес API' })
  @MaxLength(512, { message: 'Адрес API слишком длинный' })
  baseUrl?: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsOptional()
  @IsString({ message: 'Модель должна быть строкой' })
  @MaxLength(120, { message: 'Название модели слишком длинное' })
  model?: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString({ message: 'API-токен должен быть строкой' })
  @IsNotEmpty({ message: 'Укажите API-токен' })
  @MinLength(8, { message: 'API-токен слишком короткий' })
  @MaxLength(512, { message: 'API-токен слишком длинный' })
  apiToken!: string;

  @IsOptional()
  @IsEnum(AiProvider, { message: 'Укажите корректного embedding-провайдера' })
  embeddingProvider?: AiProvider;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @ValidateIf((o: UpsertAiSettingsDto) => o.embeddingProvider === AiProvider.CUSTOM)
  @IsString({ message: 'Адрес embedding API должен быть строкой' })
  @IsNotEmpty({ message: 'Для embedding CUSTOM укажите адрес API' })
  @MaxLength(512, { message: 'Адрес embedding API слишком длинный' })
  embeddingBaseUrl?: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsOptional()
  @IsString({ message: 'Embedding-модель должна быть строкой' })
  @MaxLength(120, { message: 'Название embedding-модели слишком длинное' })
  embeddingModel?: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsOptional()
  @IsString({ message: 'Embedding API-токен должен быть строкой' })
  @MinLength(8, { message: 'Embedding API-токен слишком короткий' })
  @MaxLength(512, { message: 'Embedding API-токен слишком длинный' })
  embeddingApiToken?: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    if (value === true || value === 'true' || value === 1 || value === '1') return true;
    if (value === false || value === 'false' || value === 0 || value === '0') return false;
    return value;
  })
  @IsBoolean({ message: 'Флаг очистки embedding должен быть булевым' })
  clearEmbedding?: boolean;
}
