import { IsInt, IsUUID, Min } from 'class-validator';

export class MoveTaskDto {
  @IsUUID()
  columnId!: string;

  @IsInt()
  @Min(0)
  position!: number;
}
