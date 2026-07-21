import { IsBoolean, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateChecklistItemDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  text!: string;

  @IsOptional()
  @IsBoolean()
  required?: boolean;
}
