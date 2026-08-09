'use client';

import { useCallback, useMemo } from 'react';
import { VueIsland } from '@/components/vue/VueIsland';
import type { WikiLinkTaskOption } from '@/features/wiki-links/types';
import { findMentionTrigger, insertMention } from '@/features/mentions/mention-utils';
import { findWikiLinkTrigger, insertWikiLink } from '@/features/wiki-links/wiki-link-utils';
import type { WorkspaceMember } from '@/features/workspaces/types';
import TaskDescriptionEditorView from '@/vue/task-description/TaskDescriptionEditor.vue';
import { BLOCK_TYPE_LABELS, type DescriptionDoc } from '../types';

interface TaskDescriptionEditorProps {
  value: DescriptionDoc;
  onChange: (next: DescriptionDoc) => void;
  members: WorkspaceMember[];
  wikiLinkTasks?: WikiLinkTaskOption[];
  excludeWikiTaskId?: string;
}

const TYPE_OPTIONS = Object.entries(BLOCK_TYPE_LABELS).map(([value, label]) => ({
  value,
  label,
}));

export function TaskDescriptionEditor({
  value,
  onChange,
  members,
  wikiLinkTasks = [],
  excludeWikiTaskId,
}: TaskDescriptionEditorProps) {
  const memberOptions = useMemo(
    () =>
      members.map((member) => ({
        userId: member.userId,
        name: member.user.name,
        email: member.user.email,
      })),
    [members],
  );

  const handleChange = useCallback(
    (next: DescriptionDoc) => {
      onChange(next);
    },
    [onChange],
  );

  const viewProps = useMemo(
    () => ({
      value,
      members: memberOptions,
      wikiLinkTasks,
      excludeWikiTaskId: excludeWikiTaskId ?? '',
      typeOptions: TYPE_OPTIONS,
      findMentionTrigger,
      findWikiLinkTrigger,
      insertMention,
      insertWikiLink,
      onChange: handleChange,
    }),
    [value, memberOptions, wikiLinkTasks, excludeWikiTaskId, handleChange],
  );

  return <VueIsland component={TaskDescriptionEditorView} componentProps={viewProps} />;
}
