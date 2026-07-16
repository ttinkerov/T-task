export const ActivityAction = {
  WORKSPACE_CREATED: 'WORKSPACE_CREATED',
  WORKSPACE_UPDATED: 'WORKSPACE_UPDATED',
  WORKSPACE_ARCHIVED: 'WORKSPACE_ARCHIVED',
  WORKSPACE_DELETED: 'WORKSPACE_DELETED',
  MEMBER_JOINED: 'MEMBER_JOINED',
  MEMBER_ROLE_UPDATED: 'MEMBER_ROLE_UPDATED',
  MEMBER_REMOVED: 'MEMBER_REMOVED',
  INVITATION_CREATED: 'INVITATION_CREATED',
  INVITATION_REVOKED: 'INVITATION_REVOKED',
  COLUMN_CREATED: 'COLUMN_CREATED',
  COLUMN_UPDATED: 'COLUMN_UPDATED',
  COLUMN_DELETED: 'COLUMN_DELETED',
  COLUMN_AUTOMATIONS_UPDATED: 'COLUMN_AUTOMATIONS_UPDATED',
  FORM_CREATED: 'FORM_CREATED',
  FORM_UPDATED: 'FORM_UPDATED',
  FORM_DELETED: 'FORM_DELETED',
  FUNNEL_CREATED: 'FUNNEL_CREATED',
  STAGE_CREATED: 'STAGE_CREATED',
  STAGE_UPDATED: 'STAGE_UPDATED',
  STAGE_DELETED: 'STAGE_DELETED',
  APP_CREATED: 'APP_CREATED',
  APP_DELETED: 'APP_DELETED',
} as const;

export type ActivityAction = (typeof ActivityAction)[keyof typeof ActivityAction];

export const ActivityEntityType = {
  WORKSPACE: 'WORKSPACE',
  MEMBER: 'MEMBER',
  INVITATION: 'INVITATION',
  COLUMN: 'COLUMN',
  AUTOMATION: 'AUTOMATION',
  FORM: 'FORM',
  FUNNEL: 'FUNNEL',
  STAGE: 'STAGE',
  APP: 'APP',
} as const;

export type ActivityEntityType = (typeof ActivityEntityType)[keyof typeof ActivityEntityType];

export type ActivityMetadataValue = string | number | boolean | null;

export interface RecordActivityInput {
  workspaceId: string;
  actorId?: string | null;
  actorName?: string | null;
  action: ActivityAction;
  entityType: ActivityEntityType;
  entityId?: string | null;
  entityName?: string | null;
  metadata?: Record<string, ActivityMetadataValue>;
}
