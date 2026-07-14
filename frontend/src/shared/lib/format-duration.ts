export function formatMinutes(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} мин`;
  }

  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;

  if (rest === 0) {
    return `${hours} ч`;
  }

  return `${hours} ч ${rest} мин`;
}

export function formatMinutesDelta(planMinutes: number, actualMinutes: number): string {
  const delta = actualMinutes - planMinutes;
  if (delta === 0) {
    return '0';
  }

  const sign = delta > 0 ? '+' : '−';
  return `${sign}${formatMinutes(Math.abs(delta))}`;
}
