import { ArrayUnique, IsArray, IsIn } from 'class-validator';

const ALLOWED_SCOPES = ['CRM_WRITE', 'FORMS_WRITE', 'TASK_DELETE', 'DEAL_DELETE'] as const;

export class UpdateMemberScopesDto {
  @IsArray()
  @ArrayUnique()
  @IsIn(ALLOWED_SCOPES, { each: true })
  scopes!: string[];
}
