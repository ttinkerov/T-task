import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';
import { IsEntityId } from '../../../common/validators/is-entity-id.decorator';

export class StuckTasksInsightDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(30)
  days?: number;

  @IsOptional()
  @IsEntityId()
  boardId?: string;

  @IsOptional()
  @IsEntityId()
  assigneeId?: string;
}
