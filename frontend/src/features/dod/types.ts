export type DodTemplateItem = {
  id: string;
  text: string;
  position: number;
};

export type DodTemplate = {
  id: string;
  workspaceId: string;
  name: string;
  gatesCompletion: boolean;
  position: number;
  createdAt: string;
  updatedAt: string;
  items: DodTemplateItem[];
};

export type TaskChecklistItem = {
  id: string;
  text: string;
  completed: boolean;
  required: boolean;
  position: number;
  sourceTemplateId: string | null;
};

export type CreateDodTemplatePayload = {
  name: string;
  gatesCompletion?: boolean;
  items?: string[];
};

export type UpdateDodTemplatePayload = {
  name?: string;
  gatesCompletion?: boolean;
  items?: string[];
};
