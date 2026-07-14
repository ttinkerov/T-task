import { IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class CreateTaskDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title!: string;

  @IsUUID()
  columnId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;
}
