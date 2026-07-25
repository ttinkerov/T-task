import { IsEntityId } from '../../../common/validators/is-entity-id.decorator';

export class ApplyTaskTemplateDto {
  @IsEntityId()
  templateId!: string;
}
