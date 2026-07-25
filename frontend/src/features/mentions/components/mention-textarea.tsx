'use client';

import { KeyboardEvent, useId, useMemo, useRef, useState } from 'react';
import type { WorkspaceMember } from '@/features/workspaces/types';
import { findMentionTrigger, insertMention, type MentionTrigger } from '../mention-utils';
import {
  findWikiLinkTrigger,
  insertWikiLink,
  type WikiLinkTrigger,
} from '@/features/wiki-links/wiki-link-utils';

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

type ActiveTrigger =
  { kind: 'mention'; trigger: MentionTrigger } | { kind: 'wiki'; trigger: WikiLinkTrigger };

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
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const listboxId = useId();
  const [active, setActive] = useState<ActiveTrigger | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const mentionSuggestions = useMemo(() => {
    if (!active || active.kind !== 'mention') return [];
    const query = active.trigger.query.toLocaleLowerCase('ru-RU');
    return members
      .filter((member) => {
        if (!query) return true;
        return `${member.user.name} ${member.user.email}`
          .toLocaleLowerCase('ru-RU')
          .includes(query);
      })
      .slice(0, 8);
  }, [members, active]);

  const wikiSuggestions = useMemo(() => {
    if (!active || active.kind !== 'wiki') return [];
    const query = active.trigger.query.toLocaleLowerCase('ru-RU');
    return wikiLinkTasks
      .filter((task) => task.id !== excludeWikiTaskId)
      .filter((task) => {
        if (!query) return true;
        return task.title.toLocaleLowerCase('ru-RU').includes(query);
      })
      .slice(0, 8);
  }, [wikiLinkTasks, excludeWikiTaskId, active]);

  const suggestionsOpen =
    (active?.kind === 'mention' && mentionSuggestions.length > 0) ||
    (active?.kind === 'wiki' && wikiSuggestions.length > 0);

  const refreshTrigger = (text: string, cursor: number) => {
    const wiki = findWikiLinkTrigger(text, cursor);
    if (wiki) {
      setActive({ kind: 'wiki', trigger: wiki });
      setActiveIndex(0);
      return;
    }
    const mention = findMentionTrigger(text, cursor);
    if (mention) {
      setActive({ kind: 'mention', trigger: mention });
      setActiveIndex(0);
      return;
    }
    setActive(null);
    setActiveIndex(0);
  };

  const applyResult = (result: { text: string; cursor: number }) => {
    onChange(result.text);
    setActive(null);
    requestAnimationFrame(() => {
      textareaRef.current?.focus();
      textareaRef.current?.setSelectionRange(result.cursor, result.cursor);
    });
  };

  const selectMember = (member: WorkspaceMember) => {
    if (!active || active.kind !== 'mention') return;
    applyResult(
      insertMention(value, active.trigger, {
        id: member.userId,
        name: member.user.name,
      }),
    );
  };

  const selectWikiTask = (task: WikiLinkTaskOption) => {
    if (!active || active.kind !== 'wiki') return;
    applyResult(insertWikiLink(value, active.trigger, task));
  };

  const suggestionCount =
    active?.kind === 'wiki' ? wikiSuggestions.length : mentionSuggestions.length;

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (active && suggestionCount > 0) {
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setActiveIndex((current) => (current + 1) % suggestionCount);
        return;
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault();
        setActiveIndex((current) => (current - 1 + suggestionCount) % suggestionCount);
        return;
      }
      if (event.key === 'Enter' || event.key === 'Tab') {
        event.preventDefault();
        if (active.kind === 'wiki') {
          selectWikiTask(wikiSuggestions[activeIndex]);
        } else {
          selectMember(mentionSuggestions[activeIndex]);
        }
        return;
      }
      if (event.key === 'Escape') {
        event.preventDefault();
        setActive(null);
        return;
      }
    }
    onKeyDown?.(event);
  };

  const activeOptionId =
    active?.kind === 'wiki' && wikiSuggestions[activeIndex]
      ? `${listboxId}-wiki-${wikiSuggestions[activeIndex].id}`
      : active?.kind === 'mention' && mentionSuggestions[activeIndex]
        ? `${listboxId}-option-${mentionSuggestions[activeIndex].userId}`
        : undefined;

  return (
    <div className="mention-editor">
      <textarea
        id={id}
        ref={textareaRef}
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
          refreshTrigger(event.target.value, event.target.selectionStart);
        }}
        onClick={(event) => {
          refreshTrigger(event.currentTarget.value, event.currentTarget.selectionStart);
        }}
        onBlur={() => setActive(null)}
        onKeyDown={handleKeyDown}
        className={className}
        rows={rows}
        maxLength={maxLength}
        placeholder={placeholder}
        required={required}
        autoFocus={autoFocus}
        aria-label={ariaLabel}
        aria-autocomplete="list"
        aria-controls={suggestionsOpen ? listboxId : undefined}
        aria-expanded={suggestionsOpen}
        aria-activedescendant={activeOptionId}
      />
      {active?.kind === 'mention' && mentionSuggestions.length > 0 ? (
        <ul id={listboxId} className="mention-editor__suggestions" role="listbox">
          {mentionSuggestions.map((member, index) => (
            <li
              id={`${listboxId}-option-${member.userId}`}
              key={member.userId}
              role="option"
              aria-selected={index === activeIndex}
            >
              <button
                type="button"
                className={index === activeIndex ? 'mention-editor__option--active' : undefined}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => selectMember(member)}
              >
                <span>{member.user.name}</span>
                <small>{member.user.email}</small>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      {active?.kind === 'wiki' && wikiSuggestions.length > 0 ? (
        <ul id={listboxId} className="mention-editor__suggestions" role="listbox">
          {wikiSuggestions.map((task, index) => (
            <li
              id={`${listboxId}-wiki-${task.id}`}
              key={task.id}
              role="option"
              aria-selected={index === activeIndex}
            >
              <button
                type="button"
                className={index === activeIndex ? 'mention-editor__option--active' : undefined}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => selectWikiTask(task)}
              >
                <span>{task.title}</span>
                {task.columnName ? <small>{task.columnName}</small> : null}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
