import { Allow } from 'class-validator';

export class SetCustomFieldValueDto {
  @Allow()
  value?: string | number | boolean | string[] | null;
}
