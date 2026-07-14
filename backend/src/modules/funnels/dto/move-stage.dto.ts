import { IsInt, Min } from 'class-validator';

export class MoveStageDto {
  @IsInt()
  @Min(0)
  position!: number;
}
