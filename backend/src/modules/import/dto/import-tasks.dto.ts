import { TaskPriority } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { IsEntityId } from '../../../common/validators/is-entity-id.decorator';

export class ImportColumnMappingDto {
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  status!: string;

  @IsOptional()
  @IsEntityId()
  columnId?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  newColumnName?: string;
}

export class ImportRowDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(120)
  status!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  assignee?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  @MaxLength(80, { each: true })
  labels?: string[];
}

export class ImportTasksDto {
  @IsOptional()
  @IsEntityId()
  boardId?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => ImportColumnMappingDto)
  columnMappings!: ImportColumnMappingDto[];

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(500)
  @ValidateNested({ each: true })
  @Type(() => ImportRowDto)
  rows!: ImportRowDto[];
}
