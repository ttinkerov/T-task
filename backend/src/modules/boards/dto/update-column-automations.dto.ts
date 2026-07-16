import { IsBoolean, IsOptional, ValidateIf } from 'class-validator';
import { IsEntityId } from '../../../common/validators/is-entity-id.decorator';

export class UpdateColumnAutomationsDto {
  @IsOptional()
  @ValidateIf((_object, value) => value !== null)
  @IsEntityId()
  assignUserId?: string | null;

  @IsBoolean()
  startTimer!: boolean;

  @IsBoolean()
  completeTask!: boolean;
}
