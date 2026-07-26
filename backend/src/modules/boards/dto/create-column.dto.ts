import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { IsEntityId } from '../../../common/validators/is-entity-id.decorator';

export class CreateColumnDto {
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  name!: string;

  @IsOptional()
  @IsEntityId()
  boardId?: string;
}
