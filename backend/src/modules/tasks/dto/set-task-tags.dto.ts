import { ArrayMaxSize, IsArray, IsString, MaxLength, MinLength } from 'class-validator';

export class SetTaskTagsDto {
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  @MinLength(20, { each: true })
  @MaxLength(36, { each: true })
  tagIds!: string[];
}
