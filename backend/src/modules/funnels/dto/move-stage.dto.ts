import { IsInt, Max, Min } from 'class-validator';

export class MoveStageDto {
  @IsInt()
  @Min(0)
  @Max(10_000)
  position!: number;
}
