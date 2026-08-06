'use client';

import { type KeyboardEvent, useId, useMemo } from 'react';
import { VueIsland } from '@/components/vue/VueIsland';
import type { WorkspaceMember } from '@/features/workspaces/types';
import { findWikiLinkTrigger, insertWikiLink } from '@/features/wiki-links/wiki-link-utils';
import MentionTextareaView from '@/vue/mentions/MentionTextarea.vue';
import { findMentionTrigger, insertMention } from '../mention-utils';

export interface WikiLinkTaskOption {
  id: string;
  title: string;
  columnName?: string;
}

interface MentionTextareaProps {
  value: string;
  onChange: (value: string) => void;
  members: WorkspaceMember[];
  wikiLinkTasks?: WikiLinkTaskOption[];
  excludeWikiTaskId?: string;
  className?: string;
  id?: string;
  rows?: number;
  maxLength?: number;
  placeholder?: string;
  required?: boolean;
  autoFocus?: boolean;
  'aria-label'?: string;
  onKeyDown?: (event: KeyboardEvent<HTMLTextAreaElement>) => void;
}

export function MentionTextarea({
  value,
  onChange,
  members,
  wikiLinkTasks = [],
  excludeWikiTaskId,
  className,
  id,
  rows,
  maxLength,
  placeholder,
  required,
  autoFocus,
  'aria-label': ariaLabel,
  onKeyDown,
}: MentionTextareaProps) {
  const listboxId = useId();

  const memberOptions = useMemo(
    () =>
      members.map((member) => ({
        userId: member.userId,
        name: member.user.name,
        email: member.user.email,
      })),
    [members],
  );

  const viewProps = useMemo(
    () => ({
      value,
      members: memberOptions,
      wikiLinkTasks,
      excludeWikiTaskId: excludeWikiTaskId ?? '',
      className: className ?? '',
      id: id ?? '',
      rows: rows ?? null,
      maxLength: maxLength ?? null,
      placeholder: placeholder ?? '',
      required: Boolean(required),
      autoFocus: Boolean(autoFocus),
      ariaLabel: ariaLabel ?? '',
      listboxId,
      findMentionTrigger,
      findWikiLinkTrigger,
      insertMention,
      insertWikiLink,
      onChange,
      onKeyDownExtra: onKeyDown
        ? (event: KeyboardEvent) => onKeyDown(event as KeyboardEvent<HTMLTextAreaElement>)
        : null,
    }),
    [
      value,
      memberOptions,
      wikiLinkTasks,
      excludeWikiTaskId,
      className,
      id,
      rows,
      maxLength,
      placeholder,
      required,
      autoFocus,
      ariaLabel,
      listboxId,
      onChange,
      onKeyDown,
    ],
  );

  return <VueIsland component={MentionTextareaView} componentProps={viewProps} />;
}
