'use client';

import { KeyboardEvent, useId, useMemo, useRef, useState } from 'react';
import type { WorkspaceMember } from '@/features/workspaces/types';
import { findMentionTrigger, insertMention, type MentionTrigger } from '../mention-utils';

interface MentionTextareaProps {
  value: string;
  onChange: (value: string) => void;
  members: WorkspaceMember[];
  className?: string;
  id?: string;
  rows?: number;
  maxLength?: number;
  placeholder?: string;
  required?: boolean;
  autoFocus?: boolean;
  'aria-label'?: string;
}

export function MentionTextarea({
  value,
  onChange,
  members,
  className,
  id,
  rows,
  maxLength,
  placeholder,
  required,
  autoFocus,
  'aria-label': ariaLabel,
}: MentionTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const listboxId = useId();
  const [trigger, setTrigger] = useState<MentionTrigger | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const suggestions = useMemo(() => {
    if (!trigger) return [];
    const query = trigger.query.toLocaleLowerCase('ru-RU');
    return members
      .filter((member) => {
        if (!query) return true;
        return `${member.user.name} ${member.user.email}`
          .toLocaleLowerCase('ru-RU')
          .includes(query);
      })
      .slice(0, 8);
  }, [members, trigger]);

  const refreshTrigger = (text: string, cursor: number) => {
    setTrigger(findMentionTrigger(text, cursor));
    setActiveIndex(0);
  };

  const selectMember = (member: WorkspaceMember) => {
    if (!trigger) return;
    const result = insertMention(value, trigger, {
      id: member.userId,
      name: member.user.name,
    });
    onChange(result.text);
    setTrigger(null);
    requestAnimationFrame(() => {
      textareaRef.current?.focus();
      textareaRef.current?.setSelectionRange(result.cursor, result.cursor);
    });
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (!trigger || suggestions.length === 0) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((current) => (current + 1) % suggestions.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((current) => (current - 1 + suggestions.length) % suggestions.length);
    } else if (event.key === 'Enter' || event.key === 'Tab') {
      event.preventDefault();
      selectMember(suggestions[activeIndex]);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      setTrigger(null);
    }
  };

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
        onBlur={() => setTrigger(null)}
        onKeyDown={handleKeyDown}
        className={className}
        rows={rows}
        maxLength={maxLength}
        placeholder={placeholder}
        required={required}
        autoFocus={autoFocus}
        aria-label={ariaLabel}
        aria-autocomplete="list"
        aria-controls={trigger ? listboxId : undefined}
        aria-expanded={Boolean(trigger && suggestions.length > 0)}
        aria-activedescendant={
          trigger && suggestions[activeIndex]
            ? `${listboxId}-option-${suggestions[activeIndex].userId}`
            : undefined
        }
      />
      {trigger && suggestions.length > 0 ? (
        <ul id={listboxId} className="mention-editor__suggestions" role="listbox">
          {suggestions.map((member, index) => (
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
    </div>
  );
}
