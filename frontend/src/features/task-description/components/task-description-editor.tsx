'use client';

import {
  MentionTextarea,
  type WikiLinkTaskOption,
} from '@/features/mentions/components/mention-textarea';
import type { WorkspaceMember } from '@/features/workspaces/types';
import { useCallback } from 'react';
import {
  BLOCK_TYPE_LABELS,
  createBlockId,
  type DescriptionBlock,
  type DescriptionBlockType,
  type DescriptionDoc,
  emptyDescriptionDoc,
} from '../types';

interface TaskDescriptionEditorProps {
  value: DescriptionDoc;
  onChange: (next: DescriptionDoc) => void;
  members: WorkspaceMember[];
  wikiLinkTasks?: WikiLinkTaskOption[];
  excludeWikiTaskId?: string;
}

export function TaskDescriptionEditor({
  value,
  onChange,
  members,
  wikiLinkTasks = [],
  excludeWikiTaskId,
}: TaskDescriptionEditorProps) {
  const fallback = emptyDescriptionDoc();
  const blocks = value.blocks.length > 0 ? value.blocks : fallback.blocks;

  const updateBlocks = useCallback(
    (nextBlocks: DescriptionBlock[]) => {
      onChange({
        version: 1,
        blocks: nextBlocks.length > 0 ? nextBlocks : emptyDescriptionDoc().blocks,
      });
    },
    [onChange],
  );

  const updateBlock = (index: number, patch: Partial<DescriptionBlock>) => {
    updateBlocks(blocks.map((block, i) => (i === index ? { ...block, ...patch } : block)));
  };

  const addBlockAfter = (index: number, type: DescriptionBlockType = 'paragraph') => {
    const next = [...blocks];
    next.splice(index + 1, 0, {
      id: createBlockId(),
      type,
      text: '',
      ...(type === 'toggle' ? { body: '' } : {}),
    });
    updateBlocks(next);
  };

  const removeBlock = (index: number) => {
    if (blocks.length <= 1) {
      updateBlocks([{ id: createBlockId(), type: 'paragraph', text: '' }]);
      return;
    }
    updateBlocks(blocks.filter((_, i) => i !== index));
  };

  const changeType = (index: number, type: DescriptionBlockType) => {
    const block = blocks[index];
    if (!block) return;
    updateBlock(index, {
      type,
      body: type === 'toggle' ? (block.body ?? '') : undefined,
    });
  };

  const mentionProps = {
    members,
    wikiLinkTasks,
    excludeWikiTaskId,
  };

  return (
    <div className="task-doc-editor" role="group" aria-label="Описание задачи">
      <p className="task-doc-editor__hint">
        Блоки: заголовки, списки, выноски. @ — коллега, [[ — задача. Enter — новый блок.
      </p>
      <div className="task-doc-editor__blocks">
        {blocks.map((block, index) => {
          const numberedMarker =
            block.type === 'numbered'
              ? `${blocks.slice(0, index + 1).filter((item) => item.type === 'numbered').length}.`
              : null;

          return (
            <div key={block.id} className={`task-doc-block task-doc-block--${block.type}`}>
              <div className="task-doc-block__toolbar">
                <select
                  className="glass-input task-doc-block__type"
                  value={block.type}
                  onChange={(event) =>
                    changeType(index, event.target.value as DescriptionBlockType)
                  }
                  aria-label="Тип блока"
                >
                  {Object.entries(BLOCK_TYPE_LABELS).map(([type, label]) => (
                    <option key={type} value={type}>
                      {label}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="task-doc-block__icon-btn"
                  onClick={() => addBlockAfter(index)}
                  aria-label="Добавить блок"
                >
                  +
                </button>
                <button
                  type="button"
                  className="task-doc-block__icon-btn"
                  onClick={() => removeBlock(index)}
                  aria-label="Удалить блок"
                >
                  ×
                </button>
              </div>

              {block.type === 'bullet' || block.type === 'numbered' ? (
                <div className="task-doc-block__list-row">
                  <span className="task-doc-block__marker" aria-hidden>
                    {block.type === 'bullet' ? '•' : numberedMarker}
                  </span>
                  <MentionTextarea
                    value={block.text}
                    onChange={(text) => updateBlock(index, { text })}
                    {...mentionProps}
                    className="glass-input task-doc-block__input"
                    rows={1}
                    maxLength={2000}
                    placeholder="Пункт списка…"
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' && !event.shiftKey) {
                        event.preventDefault();
                        addBlockAfter(index, block.type);
                      }
                    }}
                  />
                </div>
              ) : block.type === 'toggle' ? (
                <div className="task-doc-block__toggle">
                  <MentionTextarea
                    value={block.text}
                    onChange={(text) => updateBlock(index, { text })}
                    {...mentionProps}
                    className="glass-input task-doc-block__input task-doc-block__input--toggle-title"
                    rows={1}
                    maxLength={2000}
                    placeholder="Заголовок toggle…"
                  />
                  <MentionTextarea
                    value={block.body ?? ''}
                    onChange={(body) => updateBlock(index, { body })}
                    {...mentionProps}
                    className="glass-input task-doc-block__input"
                    rows={2}
                    maxLength={2000}
                    placeholder="Скрытое содержимое…"
                  />
                </div>
              ) : (
                <MentionTextarea
                  value={block.text}
                  onChange={(text) => updateBlock(index, { text })}
                  {...mentionProps}
                  className={`glass-input task-doc-block__input task-doc-block__input--${block.type}`}
                  rows={block.type.startsWith('heading') ? 1 : block.type === 'callout' ? 2 : 2}
                  maxLength={2000}
                  placeholder={
                    block.type === 'callout'
                      ? 'Выноска…'
                      : block.type === 'heading1'
                        ? 'Заголовок'
                        : block.type === 'heading2'
                          ? 'Подзаголовок'
                          : 'Текст…'
                  }
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && !event.shiftKey && block.type === 'paragraph') {
                      event.preventDefault();
                      addBlockAfter(index);
                    }
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
