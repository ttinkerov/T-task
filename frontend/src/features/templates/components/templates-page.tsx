'use client';

import { FormEvent, useMemo, useState } from 'react';
import { useMeQuery } from '@/features/auth/hooks';
import { useTagsQuery } from '@/features/tags/hooks';
import {
  useCreateDealTemplateMutation,
  useCreateTaskTemplateMutation,
  useDealTemplatesQuery,
  useDeleteDealTemplateMutation,
  useDeleteTaskTemplateMutation,
  useSeedDealTemplatesMutation,
  useSeedTaskTemplatesMutation,
  useTaskTemplatesQuery,
} from '../hooks';
import type { DealTemplate, TaskPriority, TaskTemplate } from '../types';

const PRIORITY_OPTIONS: { value: TaskPriority | ''; label: string }[] = [
  { value: '', label: 'Без приоритета' },
  { value: 'LOW', label: 'Низкий' },
  { value: 'MEDIUM', label: 'Средний' },
  { value: 'HIGH', label: 'Высокий' },
  { value: 'URGENT', label: 'Срочный' },
];

export function TemplatesPage({ workspaceId }: { workspaceId: string }) {
  const { data: session } = useMeQuery();
  const role = session?.workspaces.find((workspace) => workspace.id === workspaceId)?.role;
  const canManage = role === 'OWNER' || role === 'ADMIN' || role === 'MEMBER';
  const [tab, setTab] = useState<'tasks' | 'deals'>('tasks');

  return (
    <div className="dod-page templates-page">
      <header className="dod-page__header">
        <h1>Шаблоны</h1>
        <p>
          Готовые заготовки задач и сделок: поля, чеклист, теги и сабтаски. Применяйте при создании
          карточки или из уже открытой задачи/сделки — пустые поля заполнятся, теги и чеклисты
          добавятся.
        </p>
      </header>

      <div className="templates-page__tabs" role="tablist" aria-label="Тип шаблонов">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'tasks'}
          className={tab === 'tasks' ? 'is-active' : undefined}
          onClick={() => setTab('tasks')}
        >
          Задачи
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'deals'}
          className={tab === 'deals' ? 'is-active' : undefined}
          onClick={() => setTab('deals')}
        >
          Сделки
        </button>
      </div>

      {tab === 'tasks' ? (
        <TaskTemplatesPanel workspaceId={workspaceId} canManage={canManage} />
      ) : (
        <DealTemplatesPanel workspaceId={workspaceId} canManage={canManage} />
      )}
    </div>
  );
}

function TaskTemplatesPanel({
  workspaceId,
  canManage,
}: {
  workspaceId: string;
  canManage: boolean;
}) {
  const templatesQuery = useTaskTemplatesQuery(workspaceId);
  const { data: tags = [] } = useTagsQuery(workspaceId);
  const createMutation = useCreateTaskTemplateMutation(workspaceId);
  const deleteMutation = useDeleteTaskTemplateMutation(workspaceId);
  const seedMutation = useSeedTaskTemplatesMutation(workspaceId);

  const [name, setName] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority | ''>('');
  const [tagIds, setTagIds] = useState<string[]>([]);
  const [subtasksText, setSubtasksText] = useState('');
  const [checklistText, setChecklistText] = useState('');
  const [checklistGates, setChecklistGates] = useState(true);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const templates = templatesQuery.data ?? [];
  const subtaskTitles = useMemo(() => splitLines(subtasksText), [subtasksText]);
  const checklistItems = useMemo(() => splitLines(checklistText), [checklistText]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name.trim()) return;
    try {
      await createMutation.mutateAsync({
        name: name.trim(),
        title: title.trim() || undefined,
        description: description.trim() || undefined,
        priority: priority || undefined,
        tagIds,
        subtaskTitles,
        checklistItems,
        checklistGates,
      });
      setName('');
      setTitle('');
      setDescription('');
      setPriority('');
      setTagIds([]);
      setSubtasksText('');
      setChecklistText('');
      setChecklistGates(true);
    } catch {
      // surfaced below
    }
  };

  const handleDelete = async (templateId: string) => {
    setPendingId(templateId);
    try {
      await deleteMutation.mutateAsync(templateId);
    } catch {
      // surfaced below
    } finally {
      setPendingId(null);
    }
  };

  return (
    <>
      {canManage ? (
        <section className="dod-page__form-block">
          <div className="templates-page__section-head">
            <h2>Новый шаблон задачи</h2>
            {templates.length === 0 ? (
              <button
                type="button"
                className="btn-ghost"
                disabled={seedMutation.isPending}
                onClick={() => void seedMutation.mutateAsync()}
              >
                {seedMutation.isPending ? 'Добавляем…' : 'Добавить «Bug»'}
              </button>
            ) : null}
          </div>
          <form
            className="dod-page__form templates-page__form"
            onSubmit={(e) => void handleSubmit(e)}
          >
            <input
              className="glass-input"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Название шаблона (Bug)"
              maxLength={120}
              required
            />
            <input
              className="glass-input"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Заголовок по умолчанию (необязательно)"
              maxLength={200}
            />
            <textarea
              className="glass-input"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Описание"
              rows={4}
            />
            <select
              className="glass-input"
              value={priority}
              onChange={(event) => setPriority(event.target.value as TaskPriority | '')}
              aria-label="Приоритет"
            >
              {PRIORITY_OPTIONS.map((option) => (
                <option key={option.value || 'none'} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {tags.length > 0 ? (
              <fieldset className="templates-page__tags">
                <legend>Теги</legend>
                {tags.map((tag) => {
                  const checked = tagIds.includes(tag.id);
                  return (
                    <label key={tag.id}>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() =>
                          setTagIds((current) =>
                            checked ? current.filter((id) => id !== tag.id) : [...current, tag.id],
                          )
                        }
                      />
                      <span style={{ color: tag.color }}>{tag.name}</span>
                    </label>
                  );
                })}
              </fieldset>
            ) : null}
            <textarea
              className="glass-input"
              value={subtasksText}
              onChange={(event) => setSubtasksText(event.target.value)}
              placeholder={'Подзадачи — по одной в строке\nНаписать тест\nИсправить'}
              rows={3}
            />
            <textarea
              className="glass-input"
              value={checklistText}
              onChange={(event) => setChecklistText(event.target.value)}
              placeholder={'Чеклист — по одному в строке\nReproduce\nFix\nReview'}
              rows={3}
            />
            <label className="dod-page__toggle">
              <input
                type="checkbox"
                checked={checklistGates}
                onChange={(event) => setChecklistGates(event.target.checked)}
              />
              Чеклист блокирует завершение
            </label>
            <button
              type="submit"
              className="btn-primary"
              disabled={createMutation.isPending || !name.trim()}
            >
              {createMutation.isPending ? 'Создаём…' : 'Создать шаблон'}
            </button>
          </form>
          {createMutation.error || seedMutation.error ? (
            <p className="dod-page__error" role="alert">
              {createMutation.error?.message ??
                seedMutation.error?.message ??
                'Не удалось сохранить шаблон'}
            </p>
          ) : null}
        </section>
      ) : null}

      <section className="dod-page__list-block">
        <h2>Шаблоны задач</h2>
        {templatesQuery.isLoading ? <p role="status">Загрузка…</p> : null}
        {templates.length === 0 && !templatesQuery.isLoading ? (
          <p className="dod-page__empty">Пока нет шаблонов задач.</p>
        ) : (
          <ul className="dod-page__list">
            {templates.map((template) => (
              <TaskTemplateCard
                key={template.id}
                template={template}
                tagNames={tags
                  .filter((tag) => template.tagIds.includes(tag.id))
                  .map((tag) => tag.name)}
                canManage={canManage}
                pending={pendingId === template.id || deleteMutation.isPending}
                onDelete={() => void handleDelete(template.id)}
              />
            ))}
          </ul>
        )}
        {deleteMutation.error ? (
          <p className="dod-page__error" role="alert">
            {deleteMutation.error.message}
          </p>
        ) : null}
      </section>
    </>
  );
}

function TaskTemplateCard({
  template,
  tagNames,
  canManage,
  pending,
  onDelete,
}: {
  template: TaskTemplate;
  tagNames: string[];
  canManage: boolean;
  pending: boolean;
  onDelete: () => void;
}) {
  return (
    <li className="dod-page__item">
      <div>
        <strong>{template.name}</strong>
        <p>
          {[
            template.priority ? `Приоритет: ${template.priority}` : null,
            template.subtaskTitles.length ? `${template.subtaskTitles.length} сабтасков` : null,
            template.checklistItems.length ? `${template.checklistItems.length} пунктов DoD` : null,
            tagNames.length ? `Теги: ${tagNames.join(', ')}` : null,
          ]
            .filter(Boolean)
            .join(' · ') || 'Только имя'}
        </p>
      </div>
      {canManage ? (
        <button type="button" className="btn-ghost" disabled={pending} onClick={onDelete}>
          Удалить
        </button>
      ) : null}
    </li>
  );
}

function DealTemplatesPanel({
  workspaceId,
  canManage,
}: {
  workspaceId: string;
  canManage: boolean;
}) {
  const templatesQuery = useDealTemplatesQuery(workspaceId);
  const createMutation = useCreateDealTemplateMutation(workspaceId);
  const deleteMutation = useDeleteDealTemplateMutation(workspaceId);
  const seedMutation = useSeedDealTemplatesMutation(workspaceId);

  const [name, setName] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [contactName, setContactName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [pendingId, setPendingId] = useState<string | null>(null);

  const templates = templatesQuery.data ?? [];

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name.trim()) return;
    const parsedAmount = amount.trim() === '' ? undefined : Number(amount);
    if (parsedAmount !== undefined && (!Number.isFinite(parsedAmount) || parsedAmount < 0)) {
      return;
    }
    try {
      await createMutation.mutateAsync({
        name: name.trim(),
        title: title.trim() || undefined,
        description: description.trim() || undefined,
        amount: parsedAmount,
        contactName: contactName.trim() || undefined,
        companyName: companyName.trim() || undefined,
      });
      setName('');
      setTitle('');
      setDescription('');
      setAmount('');
      setContactName('');
      setCompanyName('');
    } catch {
      // surfaced below
    }
  };

  const handleDelete = async (templateId: string) => {
    setPendingId(templateId);
    try {
      await deleteMutation.mutateAsync(templateId);
    } catch {
      // surfaced below
    } finally {
      setPendingId(null);
    }
  };

  return (
    <>
      {canManage ? (
        <section className="dod-page__form-block">
          <div className="templates-page__section-head">
            <h2>Новый шаблон сделки</h2>
            {templates.length === 0 ? (
              <button
                type="button"
                className="btn-ghost"
                disabled={seedMutation.isPending}
                onClick={() => void seedMutation.mutateAsync()}
              >
                {seedMutation.isPending ? 'Добавляем…' : 'Добавить «Onboarding deal»'}
              </button>
            ) : null}
          </div>
          <form
            className="dod-page__form templates-page__form"
            onSubmit={(e) => void handleSubmit(e)}
          >
            <input
              className="glass-input"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Название шаблона (Onboarding deal)"
              maxLength={120}
              required
            />
            <input
              className="glass-input"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Заголовок сделки"
              maxLength={200}
            />
            <textarea
              className="glass-input"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Описание"
              rows={4}
            />
            <input
              className="glass-input"
              type="number"
              min={0}
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              placeholder="Сумма"
            />
            <input
              className="glass-input"
              value={contactName}
              onChange={(event) => setContactName(event.target.value)}
              placeholder="Контакт"
              maxLength={200}
            />
            <input
              className="glass-input"
              value={companyName}
              onChange={(event) => setCompanyName(event.target.value)}
              placeholder="Компания"
              maxLength={200}
            />
            <button
              type="submit"
              className="btn-primary"
              disabled={createMutation.isPending || !name.trim()}
            >
              {createMutation.isPending ? 'Создаём…' : 'Создать шаблон'}
            </button>
          </form>
          {createMutation.error || seedMutation.error ? (
            <p className="dod-page__error" role="alert">
              {createMutation.error?.message ??
                seedMutation.error?.message ??
                'Не удалось сохранить шаблон'}
            </p>
          ) : null}
        </section>
      ) : null}

      <section className="dod-page__list-block">
        <h2>Шаблоны сделок</h2>
        {templatesQuery.isLoading ? <p role="status">Загрузка…</p> : null}
        {templates.length === 0 && !templatesQuery.isLoading ? (
          <p className="dod-page__empty">Пока нет шаблонов сделок.</p>
        ) : (
          <ul className="dod-page__list">
            {templates.map((template) => (
              <DealTemplateCard
                key={template.id}
                template={template}
                canManage={canManage}
                pending={pendingId === template.id || deleteMutation.isPending}
                onDelete={() => void handleDelete(template.id)}
              />
            ))}
          </ul>
        )}
        {deleteMutation.error ? (
          <p className="dod-page__error" role="alert">
            {deleteMutation.error.message}
          </p>
        ) : null}
      </section>
    </>
  );
}

function DealTemplateCard({
  template,
  canManage,
  pending,
  onDelete,
}: {
  template: DealTemplate;
  canManage: boolean;
  pending: boolean;
  onDelete: () => void;
}) {
  return (
    <li className="dod-page__item">
      <div>
        <strong>{template.name}</strong>
        <p>
          {[
            template.title,
            template.amount != null ? `${template.amount}` : null,
            template.companyName,
          ]
            .filter(Boolean)
            .join(' · ') || 'Только имя'}
        </p>
      </div>
      {canManage ? (
        <button type="button" className="btn-ghost" disabled={pending} onClick={onDelete}>
          Удалить
        </button>
      ) : null}
    </li>
  );
}

function splitLines(value: string) {
  return value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}
