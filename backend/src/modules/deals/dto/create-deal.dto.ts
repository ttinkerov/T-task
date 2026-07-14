import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { IsEntityId } from '../../../common/validators/is-entity-id.decorator';

export class CreateDealDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title!: string;

  @IsEntityId()
  stageId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;
}
