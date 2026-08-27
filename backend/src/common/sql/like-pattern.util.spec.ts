import { describe, expect, it } from 'vitest';
import { escapeLikePattern, likeContainsPattern } from './like-pattern.util';

describe('escapeLikePattern', () => {
  it('escapes backslash, percent, and underscore', () => {
    expect(escapeLikePattern('a%b_c\\d')).toBe('a\\%b\\_c\\\\d');
  });

  it('leaves ordinary text unchanged', () => {
    expect(escapeLikePattern('онбординг')).toBe('онбординг');
  });
});

describe('likeContainsPattern', () => {
  it('wraps escaped value in wildcards', () => {
    expect(likeContainsPattern('100%_done')).toBe('%100\\%\\_done%');
  });
});
