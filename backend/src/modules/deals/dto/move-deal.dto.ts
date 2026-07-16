import { IsInt, Max, Min } from 'class-validator';
import { IsEntityId } from '../../../common/validators/is-entity-id.decorator';

export class MoveDealDto {
  @IsEntityId()
  stageId!: string;

  @IsInt()
  @Min(0)
  @Max(10_000)
  position!: number;
}
