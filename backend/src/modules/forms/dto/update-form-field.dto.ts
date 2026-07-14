import { FormFieldType } from '@prisma/client';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UpdateFormFieldDto {
  @IsOptional()
  @IsEnum(FormFieldType)
  type?: FormFieldType;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  label?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  @MaxLength(120, { each: true })
  options?: string[];

  @IsOptional()
  @IsBoolean()
  required?: boolean;
}
