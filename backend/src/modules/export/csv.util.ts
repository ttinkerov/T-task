/** RFC-4180 CSV cell escaping + formula injection mitigation. */
export function csvEscape(value: string | number | null | undefined): string {
  if (value === null || value === undefined) {
    return '';
  }

  let text = String(value);
  if (/^[=+\-@]/.test(text)) {
    text = `'${text}`;
  }

  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }

  return text;
}

export function toCsv(
  headers: string[],
  rows: Array<Array<string | number | null | undefined>>,
): string {
  const lines = [
    headers.map(csvEscape).join(','),
    ...rows.map((row) => row.map(csvEscape).join(',')),
  ];
  return `${lines.join('\n')}\n`;
}
