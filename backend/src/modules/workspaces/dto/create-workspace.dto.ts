import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { TeamSize, WorkspaceUseCase } from '@prisma/client';

export class CreateWorkspaceDto {
  @IsString({ message: 'Название обязательно' })
  @MinLength(2, { message: 'Название должно быть не короче 2 символов' })
  @MaxLength(80, { message: 'Название слишком длинное' })
  name!: string;

  @IsOptional()
  @IsEnum(TeamSize, { message: 'Некорректный размер команды' })
  teamSize?: TeamSize;

  @IsOptional()
  @IsArray({ message: 'Сценарии использования должны быть списком' })
  @ArrayMinSize(1, { message: 'Выберите хотя бы один сценарий' })
  @IsEnum(WorkspaceUseCase, { each: true, message: 'Некорректный сценарий использования' })
  useCases?: WorkspaceUseCase[];
}
