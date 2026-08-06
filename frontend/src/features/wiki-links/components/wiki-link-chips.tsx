'use client';

import { useMemo } from 'react';
import { VueIsland } from '@/components/vue/VueIsland';
import WikiLinkChipsView from '@/vue/wiki-links/WikiLinkChips.vue';
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
  const links = useMemo(
    () => extractWikiLinks(text).filter((link) => link.taskId !== excludeTaskId),
    [text, excludeTaskId],
  );

  const viewProps = useMemo(
    () => ({
      links,
      onOpenTask,
    }),
    [links, onOpenTask],
  );

  if (links.length === 0) return null;

  return <VueIsland component={WikiLinkChipsView} componentProps={viewProps} />;
}
