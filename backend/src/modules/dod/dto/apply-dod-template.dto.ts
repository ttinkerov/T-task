import { IsString, MinLength } from 'class-validator';

export class ApplyDodTemplateDto {
  @IsString()
  @MinLength(1)
  templateId!: string;
}
