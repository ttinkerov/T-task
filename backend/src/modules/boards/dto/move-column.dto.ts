import { IsInt, Max, Min } from 'class-validator';

export class MoveColumnDto {
  @IsInt()
  @Min(0)
  @Max(10_000)
  position!: number;
}
