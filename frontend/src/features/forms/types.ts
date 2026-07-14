export type FormFieldType = 'SHORT_TEXT' | 'LONG_TEXT' | 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE';

export interface FormField {
  id: string;
  type: FormFieldType;
  label: string;
  options: string[];
  required: boolean;
  position: number;
}

export interface FormSummary {
  id: string;
  title: string;
  description: string | null;
  publicToken: string;
  isPublic: boolean;
  createTaskOnSubmit: boolean;
  responseCount: number;
  fieldCount: number;
  createdAt: string;
}

export interface FormView extends Omit<FormSummary, 'fieldCount'> {
  workspaceId: string;
  fields: FormField[];
}

export interface FormChoiceStat {
  fieldId: string;
  label: string;
  options: { option: string; count: number }[];
}

export interface FormResponsesView {
  total: number;
  stats: FormChoiceStat[];
  responses: {
    id: string;
    answers: Record<string, string | string[]>;
    createdAt: string;
  }[];
}

export interface PublicFormView {
  id: string;
  title: string;
  description: string | null;
  fields: FormField[];
}

export const FORM_FIELD_TYPE_OPTIONS: { value: FormFieldType; label: string }[] = [
  { value: 'SHORT_TEXT', label: 'Короткий текст' },
  { value: 'LONG_TEXT', label: 'Развёрнутый текст' },
  { value: 'SINGLE_CHOICE', label: 'Один вариант' },
  { value: 'MULTIPLE_CHOICE', label: 'Несколько вариантов' },
];

export const FORM_FIELD_TYPE_LABELS: Record<FormFieldType, string> = {
  SHORT_TEXT: 'Короткий текст',
  LONG_TEXT: 'Развёрнутый текст',
  SINGLE_CHOICE: 'Один вариант',
  MULTIPLE_CHOICE: 'Несколько вариантов',
};
