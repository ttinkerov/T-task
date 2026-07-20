import { describe, expect, it } from 'vitest';
import { csvEscape, toCsv } from './csv.util';
import { defaultScopesForRole, hasEffectiveScope, WorkspaceScope } from '../../common/auth/scopes';
import { getBoardTemplate } from '../boards/templates/board-templates';
import { getFunnelTemplate } from '../funnels/templates/funnel-templates';

describe('csv.util', () => {
  it('escapes commas quotes and formula prefixes', () => {
    expect(csvEscape('a,b')).toBe('"a,b"');
    expect(csvEscape('say "hi"')).toBe('"say ""hi"""');
    expect(csvEscape('=1+1')).toBe("'=1+1");
  });

  it('builds csv with header', () => {
    expect(toCsv(['a', 'b'], [[1, 'x']])).toBe('a,b\n1,x\n');
  });
});

describe('scopes', () => {
  it('grants admin all scopes by role', () => {
    expect(hasEffectiveScope('ADMIN', [], WorkspaceScope.CRM_WRITE)).toBe(true);
    expect(hasEffectiveScope('VIEWER', [], WorkspaceScope.CRM_WRITE)).toBe(false);
    expect(hasEffectiveScope('VIEWER', [WorkspaceScope.CRM_WRITE], WorkspaceScope.CRM_WRITE)).toBe(
      true,
    );
  });

  it('maps member defaults', () => {
    expect(defaultScopesForRole('MEMBER')).toContain(WorkspaceScope.TASK_DELETE);
  });
});

describe('templates', () => {
  it('falls back to default templates', () => {
    expect(getBoardTemplate('missing').id).toBe('kanban');
    expect(getFunnelTemplate('sales').stages.length).toBeGreaterThan(2);
  });
});
