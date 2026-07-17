import { IsIn } from 'class-validator';
import { IsEntityId } from '../../../common/validators/is-entity-id.decorator';

export const TASK_RELATION_VIEW_TYPES = ['BLOCKS', 'WAITING_FOR', 'RELATES_TO'] as const;
export type TaskRelationViewType = (typeof TASK_RELATION_VIEW_TYPES)[number];

export class CreateTaskRelationDto {
  @IsEntityId()
  relatedTaskId!: string;

  @IsIn(TASK_RELATION_VIEW_TYPES)
  type!: TaskRelationViewType;
}
