'use client';

import { extractWikiLinks } from '../wiki-link-utils';

export function WikiLinkChips({
  text,
  excludeTaskId,
  onOpenTask,
}: {
  text: string;
  excludeTaskId?: string;
  onOpenTask: (taskId: string) => void;
}) {
  const links = extractWikiLinks(text).filter((link) => link.taskId !== excludeTaskId);
  if (links.length === 0) return null;

  return (
    <div className="wiki-link-chips" aria-label="Ссылки на задачи">
      {links.map((link) => (
        <button
          key={link.taskId}
          type="button"
          className="wiki-link-chip"
          onClick={() => onOpenTask(link.taskId)}
        >
          [[{link.title}]]
        </button>
      ))}
    </div>
  );
}
