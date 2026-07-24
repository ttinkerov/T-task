import { TaskPriority, TaskRecurrenceAction, TaskRecurrenceRule } from '@prisma/client';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsArray,
  IsBoolean,
  IsObject,
  ArrayMinSize,
  ArrayMaxSize,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { IsEntityId } from '../../../common/validators/is-entity-id.decorator';

export class UpdateTaskDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsString()
  @MaxLength(2000)
  description?: string | null;

  /** Notion-style block document for the task description. */
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsObject()
  descriptionDoc?: Record<string, unknown> | null;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsEnum(TaskPriority)
  priority?: TaskPriority | null;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsInt()
  @Min(1)
  @Max(13)
  complexity?: number | null;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsInt()
  @Min(1)
  @Max(10080)
  timeEstimateMinutes?: number | null;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsInt()
  @Min(1)
  @Max(10080)
  actualMinutes?: number | null;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsDateString()
  dueDate?: string | null;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsEntityId()
  assigneeId?: string | null;

  @IsOptional()
  @IsEnum(TaskRecurrenceRule)
  recurrenceRule?: TaskRecurrenceRule;

  @IsOptional()
  @IsEnum(TaskRecurrenceAction)
  recurrenceAction?: TaskRecurrenceAction;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(0)
  @ArrayMaxSize(7)
  @IsInt({ each: true })
  @Min(1, { each: true })
  @Max(7, { each: true })
  recurrenceWeekdays?: number[];

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsEntityId()
  recurrenceOriginColumnId?: string | null;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsEntityId()
  sprintId?: string | null;

  @IsOptional()
  @IsBoolean()
  isEpic?: boolean;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsEntityId()
  epicId?: string | null;
}
