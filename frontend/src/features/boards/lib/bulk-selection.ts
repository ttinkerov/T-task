export function toggleTaskSelection(
  selected: Set<string>,
  taskId: string,
  orderedIds: string[],
  options: { additive?: boolean; range?: boolean; anchorId?: string | null } = {},
): { next: Set<string>; anchorId: string } {
  const { additive = false, range = false, anchorId = null } = options;

  if (range && anchorId) {
    const from = orderedIds.indexOf(anchorId);
    const to = orderedIds.indexOf(taskId);
    if (from >= 0 && to >= 0) {
      const [start, end] = from < to ? [from, to] : [to, from];
      const rangeIds = orderedIds.slice(start, end + 1);
      if (additive) {
        const next = new Set(selected);
        for (const id of rangeIds) next.add(id);
        return { next, anchorId };
      }
      return { next: new Set(rangeIds), anchorId };
    }
  }

  if (additive) {
    const next = new Set(selected);
    if (next.has(taskId)) next.delete(taskId);
    else next.add(taskId);
    return { next, anchorId: taskId };
  }

  if (selected.size === 1 && selected.has(taskId)) {
    return { next: new Set(), anchorId: taskId };
  }

  return { next: new Set([taskId]), anchorId: taskId };
}
