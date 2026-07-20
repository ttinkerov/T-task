import { IsDateString, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateSprintDto {
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name!: string;

  @IsDateString()
  startDate!: string;

  @IsDateString()
  endDate!: string;
}
