export type CustomFieldType =
  'TEXT' | 'NUMBER' | 'DATE' | 'CHECKBOX' | 'SELECT' | 'MULTI_SELECT' | 'URL' | 'USER';

export interface CustomFieldDefinition {
  id: string;
  workspaceId: string;
  name: string;
  type: CustomFieldType;
  options: string[];
  showOnCard: boolean;
  position: number;
  createdAt: string;
}

export type CustomFieldValue = string | number | boolean | string[] | null;

export interface CreateCustomFieldPayload {
  name: string;
  type: CustomFieldType;
  options?: string[];
  showOnCard?: boolean;
}

export interface UpdateCustomFieldPayload {
  name?: string;
  options?: string[];
  showOnCard?: boolean;
}

export const CUSTOM_FIELD_TYPE_OPTIONS: { value: CustomFieldType; label: string }[] = [
  { value: 'TEXT', label: 'Текст' },
  { value: 'NUMBER', label: 'Число' },
  { value: 'DATE', label: 'Дата' },
  { value: 'CHECKBOX', label: 'Флажок' },
  { value: 'SELECT', label: 'Выбор' },
  { value: 'MULTI_SELECT', label: 'Мультивыбор' },
  { value: 'URL', label: 'Ссылка' },
  { value: 'USER', label: 'Пользователь' },
];

export const CUSTOM_FIELD_TYPE_LABELS: Record<CustomFieldType, string> = {
  TEXT: 'Текст',
  NUMBER: 'Число',
  DATE: 'Дата',
  CHECKBOX: 'Флажок',
  SELECT: 'Выбор',
  MULTI_SELECT: 'Мультивыбор',
  URL: 'Ссылка',
  USER: 'Пользователь',
};

export const CHOICE_FIELD_TYPES: CustomFieldType[] = ['SELECT', 'MULTI_SELECT'];
