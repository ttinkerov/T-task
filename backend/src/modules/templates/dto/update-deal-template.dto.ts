import { IsInt, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';

export class UpdateDealTemplateDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(1_000_000_000)
  amount?: number | null;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  contactName?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  companyName?: string | null;
}
