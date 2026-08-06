'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useMembersQuery } from '@/features/workspaces/hooks';
import { ApplyDealTemplateControl } from '@/features/templates/components/apply-deal-template-control';
import { useUpdateDealMutation } from '../hooks';
import type { FunnelDeal } from '../types';
import { DealDrawerActions } from './deal-drawer-actions';
import { DealDrawerHeader } from './deal-drawer-header';
import { DealRollupSection } from './deal-rollup-section';
import { DealTasksSection } from './deal-tasks-section';

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

  return (
    <div className="task-drawer-overlay" onClick={onClose} role="presentation">
      <aside
        className="task-drawer"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Редактирование сделки"
      >
        <DealDrawerHeader stageName={stageName} onClose={onClose} />

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

          <ApplyDealTemplateControl
            workspaceId={workspaceId}
            funnelId={funnelId}
            dealId={deal.id}
            onApplied={(next) => {
              setTitle(next.title);
              setDescription(next.description ?? '');
              setAmount(next.amount?.toString() ?? '');
              setContactName(next.contactName ?? '');
              setCompanyName(next.companyName ?? '');
              setAssigneeId(next.assigneeId ?? '');
            }}
          />

          <DealDrawerActions
            workspaceId={workspaceId}
            funnelId={funnelId}
            dealId={deal.id}
            title={title}
            isSaving={updateMutation.isPending}
            saveError={updateMutation.error?.message}
            onClose={onClose}
          />
        </form>

        <DealRollupSection workspaceId={workspaceId} dealId={deal.id} />
        <DealTasksSection workspaceId={workspaceId} dealId={deal.id} />
      </aside>
    </div>
  );
}
