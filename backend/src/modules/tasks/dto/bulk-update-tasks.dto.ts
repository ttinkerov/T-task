import { TaskPriority } from '@prisma/client';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { IsEntityId } from '../../../common/validators/is-entity-id.decorator';

export class BulkUpdateTasksDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @IsString({ each: true })
  @MinLength(20, { each: true })
  @MaxLength(36, { each: true })
  taskIds!: string[];

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsEntityId()
  assigneeId?: string | null;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsEnum(TaskPriority)
  priority?: TaskPriority | null;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsEntityId()
  sprintId?: string | null;

  @IsOptional()
  @IsEntityId()
  columnId?: string;
}
