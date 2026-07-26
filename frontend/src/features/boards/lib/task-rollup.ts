export type RollupTaskLike = {
  completed: boolean;
  dueDate: string | null;
};

export type RollupDealLike = {
  amount: number | null;
};

export type TaskLinkRollup = {
  relatedTaskCount: number;
  completedTaskCount: number;
  donePercent: number | null;
  dealCount: number;
  amountSum: number;
  nearestDue: string | null;
};

export function computeTaskLinkRollup(
  relatedTasks: RollupTaskLike[],
  deals: RollupDealLike[],
  now: Date = new Date(),
): TaskLinkRollup {
  const relatedTaskCount = relatedTasks.length;
  const completedTaskCount = relatedTasks.filter((task) => task.completed).length;
  const donePercent =
    relatedTaskCount === 0 ? null : Math.round((completedTaskCount / relatedTaskCount) * 100);

  const amounts = deals
    .map((deal) => deal.amount)
    .filter((amount): amount is number => typeof amount === 'number' && Number.isFinite(amount));
  const amountSum = amounts.reduce((sum, amount) => sum + amount, 0);

  return {
    relatedTaskCount,
    completedTaskCount,
    donePercent,
    dealCount: deals.length,
    amountSum,
    nearestDue: pickNearestDue(
      relatedTasks.map((task) => task.dueDate),
      now,
    ),
  };
}

export type DealLinkRollup = {
  linkedTaskCount: number;
  completedTaskCount: number;
  donePercent: number | null;
  nearestDue: string | null;
};

export function computeDealLinkRollup(
  linkedTasks: RollupTaskLike[],
  now: Date = new Date(),
): DealLinkRollup {
  const linkedTaskCount = linkedTasks.length;
  const completedTaskCount = linkedTasks.filter((task) => task.completed).length;
  const donePercent =
    linkedTaskCount === 0 ? null : Math.round((completedTaskCount / linkedTaskCount) * 100);

  return {
    linkedTaskCount,
    completedTaskCount,
    donePercent,
    nearestDue: pickNearestDue(
      linkedTasks.map((task) => task.dueDate),
      now,
    ),
  };
}

export function pickNearestDue(dueDates: Array<string | null | undefined>, now: Date = new Date()) {
  const parsed = dueDates
    .map((value) => {
      if (!value) return null;
      const date = new Date(value);
      return Number.isNaN(date.getTime()) ? null : date;
    })
    .filter((date): date is Date => date !== null);

  if (parsed.length === 0) return null;

  const upcoming = parsed
    .filter((date) => date.getTime() >= startOfDay(now).getTime())
    .sort((a, b) => a.getTime() - b.getTime());
  if (upcoming.length > 0) {
    return upcoming[0].toISOString();
  }

  const past = [...parsed].sort((a, b) => b.getTime() - a.getTime());
  return past[0].toISOString();
}

function startOfDay(value: Date) {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate());
}

export function formatRollupDue(value: string | null) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatRollupAmount(amount: number) {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0,
  }).format(amount);
}
