import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export const STAGE_DEALS_PAGE_DEFAULT = 100;
export const STAGE_DEALS_PAGE_MAX = 200;

export class ListStageDealsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number = 0;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(STAGE_DEALS_PAGE_MAX)
  limit?: number = STAGE_DEALS_PAGE_DEFAULT;
}
