export function mapDueDate(raw: string | undefined | null): string | undefined {
  if (!raw?.trim()) return undefined;
  const value = raw.trim();

  const isoMatch = value.match(/^(\d{4}-\d{2}-\d{2})/);
  if (isoMatch) return isoMatch[1];

  const dotted = value.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})/);
  if (dotted) {
    const day = dotted[1].padStart(2, '0');
    const month = dotted[2].padStart(2, '0');
    return `${dotted[3]}-${month}-${day}`;
  }

  const slashed = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (slashed) {
    const first = Number(slashed[1]);
    const second = Number(slashed[2]);

    if (first > 12) {
      return `${slashed[3]}-${String(second).padStart(2, '0')}-${String(first).padStart(2, '0')}`;
    }
    return `${slashed[3]}-${String(first).padStart(2, '0')}-${String(second).padStart(2, '0')}`;
  }

  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }

  return undefined;
}
