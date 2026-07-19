import { IsEntityId } from '../../../common/validators/is-entity-id.decorator';

export class LinkDealTaskDto {
  @IsEntityId()
  taskId!: string;
}

export class LinkTaskDealDto {
  @IsEntityId()
  dealId!: string;
}
