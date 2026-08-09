'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { VueIsland } from '@/components/vue/VueIsland';
import { ApplyDealTemplateControl } from '@/features/templates/components/apply-deal-template-control';
import { useMembersQuery } from '@/features/workspaces/hooks';
import DealDetailDrawerView from '@/vue/crm/DealDetailDrawerView.vue';
import { useDeleteDealMutation, useUpdateDealMutation } from '../hooks';
import type { FunnelDeal } from '../types';
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
  const membersQuery = useMembersQuery(workspaceId);
  const members = membersQuery.data ?? [];
  const updateMutation = useUpdateDealMutation(workspaceId, funnelId);
  const deleteMutation = useDeleteDealMutation(workspaceId, funnelId);

  const [title, setTitle] = useState(deal.title);
  const [description, setDescription] = useState(deal.description ?? '');
  const [amount, setAmount] = useState(deal.amount?.toString() ?? '');
  const [contactName, setContactName] = useState(deal.contactName ?? '');
  const [companyName, setCompanyName] = useState(deal.companyName ?? '');
  const [assigneeId, setAssigneeId] = useState(deal.assigneeId ?? '');
  const [actionError, setActionError] = useState('');
  const [hosts, setHosts] = useState<{
    template: HTMLElement | null;
    rollup: HTMLElement | null;
    tasks: HTMLElement | null;
  }>({ template: null, rollup: null, tasks: null });

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

  const onHostsReady = useCallback(
    (next: {
      template: HTMLElement | null;
      rollup: HTMLElement | null;
      tasks: HTMLElement | null;
    }) => {
      setHosts(next);
    },
    [],
  );

  const onSubmit = useCallback(async () => {
    if (!title.trim()) return;

    const parsedAmount = amount.trim() === '' ? null : Number(amount);
    setActionError('');

    try {
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
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Не удалось сохранить сделку');
    }
  }, [
    amount,
    assigneeId,
    companyName,
    contactName,
    deal.id,
    description,
    onClose,
    title,
    updateMutation,
  ]);

  const onDelete = useCallback(async () => {
    setActionError('');
    try {
      await deleteMutation.mutateAsync(deal.id);
      onClose();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Не удалось удалить сделку');
    }
  }, [deleteMutation, deal.id, onClose]);

  const onRetryMembers = useCallback(() => {
    void membersQuery.refetch();
  }, [membersQuery]);

  const membersLoadError = membersQuery.isError
    ? membersQuery.error instanceof Error
      ? membersQuery.error.message
      : 'Не удалось загрузить участников'
    : '';

  const viewProps = useMemo(
    () => ({
      stageName,
      title,
      description,
      amount,
      contactName,
      companyName,
      assigneeId,
      members,
      membersLoadError,
      isSaving: updateMutation.isPending,
      canSave: Boolean(title.trim()),
      saveError: actionError,
      deletePending: deleteMutation.isPending,
      onClose,
      onSubmit,
      onDelete,
      onTitleChange: setTitle,
      onDescriptionChange: setDescription,
      onAmountChange: setAmount,
      onContactNameChange: setContactName,
      onCompanyNameChange: setCompanyName,
      onAssigneeChange: setAssigneeId,
      onHostsReady,
      onRetryMembers,
    }),
    [
      stageName,
      title,
      description,
      amount,
      contactName,
      companyName,
      assigneeId,
      members,
      membersLoadError,
      updateMutation.isPending,
      actionError,
      deleteMutation.isPending,
      onClose,
      onSubmit,
      onDelete,
      onHostsReady,
      onRetryMembers,
    ],
  );

  return (
    <>
      <VueIsland component={DealDetailDrawerView} componentProps={viewProps} />
      {hosts.template
        ? createPortal(
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
            />,
            hosts.template,
          )
        : null}
      {hosts.rollup
        ? createPortal(
            <DealRollupSection workspaceId={workspaceId} dealId={deal.id} />,
            hosts.rollup,
          )
        : null}
      {hosts.tasks
        ? createPortal(<DealTasksSection workspaceId={workspaceId} dealId={deal.id} />, hosts.tasks)
        : null}
    </>
  );
}
