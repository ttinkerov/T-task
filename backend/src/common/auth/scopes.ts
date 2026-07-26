export const WorkspaceScope = {
  CRM_WRITE: 'CRM_WRITE',
  FORMS_WRITE: 'FORMS_WRITE',
  TASK_DELETE: 'TASK_DELETE',
  DEAL_DELETE: 'DEAL_DELETE',
} as const;

export type WorkspaceScopeValue = (typeof WorkspaceScope)[keyof typeof WorkspaceScope];

const ALL_SCOPES = Object.values(WorkspaceScope);

export function defaultScopesForRole(role: string): WorkspaceScopeValue[] {
  switch (role) {
    case 'OWNER':
    case 'ADMIN':
      return [...ALL_SCOPES];
    case 'MEMBER':
      return [
        WorkspaceScope.CRM_WRITE,
        WorkspaceScope.FORMS_WRITE,
        WorkspaceScope.TASK_DELETE,
        WorkspaceScope.DEAL_DELETE,
      ];
    case 'VIEWER':
    default:
      return [];
  }
}

export function hasEffectiveScope(
  role: string,
  memberScopes: string[],
  required: WorkspaceScopeValue,
): boolean {
  if (defaultScopesForRole(role).includes(required)) {
    return true;
  }
  return memberScopes.includes(required);
}
