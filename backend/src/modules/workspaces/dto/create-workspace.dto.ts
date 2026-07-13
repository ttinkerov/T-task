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
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  name!: string;

  @IsOptional()
  @IsEnum(TeamSize)
  teamSize?: TeamSize;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @IsEnum(WorkspaceUseCase, { each: true })
  useCases?: WorkspaceUseCase[];
}
