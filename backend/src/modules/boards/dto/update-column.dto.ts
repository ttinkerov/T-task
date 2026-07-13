import { IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateColumnDto {
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  name!: string;
}
