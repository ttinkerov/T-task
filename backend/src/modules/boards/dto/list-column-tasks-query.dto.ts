import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export const COLUMN_TASKS_PAGE_DEFAULT = 100;
export const COLUMN_TASKS_PAGE_MAX = 200;

export class ListColumnTasksQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number = 0;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(COLUMN_TASKS_PAGE_MAX)
  limit?: number = COLUMN_TASKS_PAGE_DEFAULT;
}
