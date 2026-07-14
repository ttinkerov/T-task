'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useMembersQuery } from '@/features/workspaces/hooks';
import { useDeleteDealMutation, useUpdateDealMutation } from '../hooks';
import type { FunnelDeal } from '../types';

interface DealDetailDrawerProps {
  workspaceId: string;
  funnelId: string;
  deal: FunnelDeal;
  stageName: string;
  onClose: () => void;
}

export function DealDetailDrawer({
  workspaceId,
  funnelId,
  deal,
  stageName,
  onClose,
}: DealDetailDrawerProps) {
  const { data: members = [] } = useMembersQuery(workspaceId);
  const updateMutation = useUpdateDealMutation(workspaceId, funnelId);
  const deleteMutation = useDeleteDealMutation(workspaceId, funnelId);

  const [title, setTitle] = useState(deal.title);
  const [description, setDescription] = useState(deal.description ?? '');
  const [amount, setAmount] = useState(deal.amount?.toString() ?? '');
  const [contactName, setContactName] = useState(deal.contactName ?? '');
  const [companyName, setCompanyName] = useState(deal.companyName ?? '');
  const [assigneeId, setAssigneeId] = useState(deal.assigneeId ?? '');

  useEffect(() => {
    setTitle(deal.title);
    setDescription(deal.description ?? '');
    setAmount(deal.amount?.toString() ?? '');
    setContactName(deal.contactName ?? '');
    setCompanyName(deal.companyName ?? '');
    setAssigneeId(deal.assigneeId ?? '');
  }, [deal]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!title.trim()) return;

    const parsedAmount = amount.trim() === '' ? null : Number(amount);

    await updateMutation.mutateAsync({
      dealId: deal.id,
      data: {
        title: title.trim(),
        description: description.trim() || null,
        amount: parsedAmount === null || Number.isNaN(parsedAmount) ? null : parsedAmount,
        contactName: contactName.trim() || null,
        companyName: companyName.trim() || null,
        assigneeId: assigneeId || null,
      },
    });
    onClose();
  };

  const handleDelete = async () => {
    await deleteMutation.mutateAsync(deal.id);
    onClose();
  };

  return (
    <div className="task-drawer-overlay" onClick={onClose} role="presentation">
      <aside
        className="task-drawer"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Редактирование сделки"
      >
        <div className="task-drawer__header">
          <div>
            <p className="task-drawer__eyebrow">{stageName}</p>
            <h2 className="task-drawer__heading">Сделка</h2>
          </div>
          <button
            type="button"
            className="dashboard-header__icon-btn"
            onClick={onClose}
            aria-label="Закрыть"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="task-drawer__form">
          <label className="task-drawer__field">
            <span>Название</span>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="glass-input"
              required
              maxLength={200}
              autoFocus
            />
          </label>

          <label className="task-drawer__field">
            <span>Описание</span>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className="glass-input task-drawer__textarea"
              rows={3}
              maxLength={2000}
              placeholder="Детали сделки..."
            />
          </label>

          <div className="task-drawer__grid">
            <label className="task-drawer__field">
              <span>Сумма, ₽</span>
              <input
                type="number"
                min={0}
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                className="glass-input"
                placeholder="0"
              />
            </label>

            <label className="task-drawer__field">
              <span>Ответственный</span>
              <select
                value={assigneeId}
                onChange={(event) => setAssigneeId(event.target.value)}
                className="glass-input"
              >
                <option value="">Не назначен</option>
                {members.map((member) => (
                  <option key={member.userId} value={member.userId}>
                    {member.user.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="task-drawer__grid">
            <label className="task-drawer__field">
              <span>Контакт</span>
              <input
                value={contactName}
                onChange={(event) => setContactName(event.target.value)}
                className="glass-input"
                maxLength={120}
                placeholder="Имя клиента"
              />
            </label>

            <label className="task-drawer__field">
              <span>Компания</span>
              <input
                value={companyName}
                onChange={(event) => setCompanyName(event.target.value)}
                className="glass-input"
                maxLength={120}
                placeholder="Название компании"
              />
            </label>
          </div>

          {updateMutation.error ? (
            <p className="text-sm text-red-400">{updateMutation.error.message}</p>
          ) : null}

          <div className="task-drawer__actions">
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="btn-ghost task-drawer__danger"
            >
              Удалить
            </button>
            <button
              type="submit"
              disabled={updateMutation.isPending || !title.trim()}
              className="btn-primary"
            >
              {updateMutation.isPending ? 'Сохранение...' : 'Сохранить'}
            </button>
          </div>
        </form>
      </aside>
    </div>
  );
}
