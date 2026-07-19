import { Type } from 'class-transformer';
import { TaskPriority } from '@prisma/client';
import { IsEnum, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { IsEntityId } from '../../../common/validators/is-entity-id.decorator';

export enum AllTasksStatus {
  OPEN = 'OPEN',
  COMPLETED = 'COMPLETED',
}

export enum AllTasksDueFilter {
  OVERDUE = 'OVERDUE',
  UPCOMING = 'UPCOMING',
  NO_DUE = 'NO_DUE',
}

export enum AllTasksSort {
  CREATED_AT = 'CREATED_AT',
  UPDATED_AT = 'UPDATED_AT',
  DUE_DATE = 'DUE_DATE',
  PRIORITY = 'PRIORITY',
  TITLE = 'TITLE',
}

export enum SortOrder {
  ASC = 'ASC',
  DESC = 'DESC',
}

export class ListAllTasksQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 50;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  search?: string;

  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @IsOptional()
  @IsEntityId()
  assigneeId?: string;

  @IsOptional()
  @IsEntityId()
  boardId?: string;

  @IsOptional()
  @IsEntityId()
  columnId?: string;

  @IsOptional()
  @IsEnum(AllTasksStatus)
  status?: AllTasksStatus;

  @IsOptional()
  @IsEnum(AllTasksDueFilter)
  due?: AllTasksDueFilter;

  @IsOptional()
  @IsEnum(AllTasksSort)
  sortBy: AllTasksSort = AllTasksSort.CREATED_AT;

  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder: SortOrder = SortOrder.DESC;
}
