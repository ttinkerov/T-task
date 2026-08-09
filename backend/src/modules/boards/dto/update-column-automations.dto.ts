import { IsBoolean, IsOptional, IsString, IsUrl, MaxLength, ValidateIf } from 'class-validator';
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

  @IsOptional()
  @IsBoolean()
  notifyWatchers?: boolean;

  @IsOptional()
  @ValidateIf((_object, value) => value !== null && value !== '')
  @IsEntityId()
  customFieldId?: string | null;

  @IsOptional()
  customFieldValue?: string | number | boolean | null;

  @IsOptional()
  @ValidateIf((_object, value) => value !== null && value !== '')
  @IsUrl({ require_tld: false }, { message: 'Укажите корректный URL вебхука' })
  @MaxLength(2048)
  webhookUrl?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(280)
  notifyMessage?: string | null;
}
