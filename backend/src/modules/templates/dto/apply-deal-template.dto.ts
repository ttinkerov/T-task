import { IsEntityId } from '../../../common/validators/is-entity-id.decorator';

export class ApplyDealTemplateDto {
  @IsEntityId()
  templateId!: string;
}
