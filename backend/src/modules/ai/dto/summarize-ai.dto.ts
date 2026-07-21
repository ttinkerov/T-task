import { Transform } from 'class-transformer';
import { IsDateString, IsIn, IsOptional, ValidateIf } from 'class-validator';
import { IsEntityId } from '../../../common/validators/is-entity-id.decorator';

export class SummarizeAiDto {
  @IsIn(['sprint', 'day'])
  scope!: 'sprint' | 'day';

  @ValidateIf((dto: SummarizeAiDto) => dto.scope === 'sprint')
  @IsEntityId()
  sprintId?: string;

  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsDateString()
  date?: string;
}
