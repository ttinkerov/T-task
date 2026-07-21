import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { IsEntityId } from '../../../common/validators/is-entity-id.decorator';

export class CreateTaskDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title!: string;

  @IsEntityId()
  columnId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsEntityId()
  epicId?: string;
}
