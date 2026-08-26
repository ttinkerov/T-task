import { describe, expect, it } from 'vitest';
import { buildMailTaskLink } from './mail-task-link';

describe('buildMailTaskLink', () => {
  it('uses /dashboard/board (singular) with task query', () => {
    expect(buildMailTaskLink('http://localhost:3000', 'task-1')).toBe(
      'http://localhost:3000/dashboard/board?task=task-1',
    );
  });

  it('strips trailing slash from APP_URL', () => {
    expect(buildMailTaskLink('https://app.example.com/', 'abc')).toBe(
      'https://app.example.com/dashboard/board?task=abc',
    );
  });

  it('encodes task id', () => {
    expect(buildMailTaskLink('http://localhost:3000', 'a b')).toBe(
      'http://localhost:3000/dashboard/board?task=a+b',
    );
  });
});
