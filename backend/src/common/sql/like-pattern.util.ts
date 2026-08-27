/** Escape `\`, `%`, and `_` for use in SQL ILIKE/LIKE with ESCAPE '\\'. */
export function escapeLikePattern(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_');
}

/** Build a contains-pattern (`%value%`) safe for ILIKE … ESCAPE '\\'. */
export function likeContainsPattern(value: string): string {
  return `%${escapeLikePattern(value)}%`;
}
