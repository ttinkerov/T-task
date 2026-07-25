'use client';

import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  horizontalListSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { FormEvent, memo, useEffect, useMemo, useState, type HTMLAttributes } from 'react';
import { useDealTemplatesQuery } from '@/features/templates';
import { VirtualizedColumnList } from '@/shared/ui/virtualized-column-list';
import {
  useCreateDealMutation,
  useCreateFunnelMutation,
  useCreateStageMutation,
  useDeleteStageMutation,
  useFunnelQuery,
  useFunnelsQuery,
  useLoadMoreStageDealsMutation,
  useMoveDealMutation,
  useMoveStageMutation,
  useUpdateStageMutation,
} from '../hooks';
import { formatDealAmount, type FunnelDeal, type FunnelStage, type FunnelView } from '../types';
import { DealDetailDrawer } from './deal-detail-drawer';

export function FunnelBoard({ workspaceId }: { workspaceId: string }) {
  const { data: funnels = [], isLoading: funnelsLoading } = useFunnelsQuery(workspaceId);
  const [funnelId, setFunnelId] = useState<string | null>(null);
  const { data: funnel, isLoading: funnelLoading } = useFunnelQuery(workspaceId, funnelId);

  useEffect(() => {
    if (!funnelId && funnels.length > 0) {
      setFunnelId(funnels[0].id);
    }
  }, [funnelId, funnels]);

  if (funnelsLoading) {
    return <p className="text-sm text-muted-foreground">Загрузка воронок...</p>;
  }

  return (
    <div className="crm-page">
      <FunnelToolbar
        workspaceId={workspaceId}
        funnels={funnels}
        funnelId={funnelId}
        onFunnelChange={setFunnelId}
      />

      {funnelLoading || !funnel || !funnelId ? (
        <p className="text-sm text-muted-foreground">Загрузка воронки...</p>
      ) : (
        <FunnelBoardView workspaceId={workspaceId} funnel={funnel} />
      )}
    </div>
  );
}

function FunnelToolbar({
  workspaceId,
  funnels,
  funnelId,
  onFunnelChange,
}: {
  workspaceId: string;
  funnels: { id: string; name: string }[];
  funnelId: string | null;
  onFunnelChange: (id: string) => void;
}) {
  const createFunnelMutation = useCreateFunnelMutation(workspaceId);
  const [name, setName] = useState('');

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name.trim()) return;
    const created = await createFunnelMutation.mutateAsync(name.trim());
    if (created?.id) {
      onFunnelChange(created.id);
    }
    setName('');
  };

  return (
    <div className="crm-toolbar">
      <div>
        <h1 className="crm-toolbar__title">CRM — воронки</h1>
        <p className="crm-toolbar__hint">
          Сделки двигаются по этапам, как на канбан-доске. Разные воронки — для разных направлений.
        </p>
      </div>

      <div className="crm-toolbar__actions">
        <select
          value={funnelId ?? ''}
          onChange={(event) => onFunnelChange(event.target.value)}
          className="glass-input crm-toolbar__select"
        >
          {funnels.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>

        <form onSubmit={handleCreate} className="crm-toolbar__create">
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Новая воронка"
            maxLength={80}
            className="glass-input"
          />
          <button
            type="submit"
            disabled={!name.trim() || createFunnelMutation.isPending}
            className="btn-ghost"
          >
            +
          </button>
        </form>
      </div>
    </div>
  );
}

type DragType = 'stage' | 'deal';

function FunnelBoardView({ workspaceId, funnel }: { workspaceId: string; funnel: FunnelView }) {
  const moveDealMutation = useMoveDealMutation(workspaceId, funnel.id);
  const moveStageMutation = useMoveStageMutation(workspaceId, funnel.id);
  const [activeDeal, setActiveDeal] = useState<FunnelDeal | null>(null);
  const [activeStage, setActiveStage] = useState<FunnelStage | null>(null);
  const [selectedDealId, setSelectedDealId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragStart = (event: DragStartEvent) => {
    const type = event.active.data.current?.type as DragType | undefined;

    if (type === 'stage') {
      const stage = funnel.stages.find((item) => item.id === String(event.active.id));
      setActiveStage(stage ?? null);
      setActiveDeal(null);
      return;
    }

    setActiveStage(null);
    setActiveDeal(findDeal(funnel, String(event.active.id)));
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const type = event.active.data.current?.type as DragType | undefined;
    setActiveDeal(null);
    setActiveStage(null);

    const { active, over } = event;
    if (!over) return;

    if (type === 'stage') {
      const stageId = String(active.id);
      const overStageId = String(over.id);
      if (stageId === overStageId) return;

      const fromIndex = funnel.stages.findIndex((stage) => stage.id === stageId);
      const toIndex = funnel.stages.findIndex((stage) => stage.id === overStageId);
      if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) return;

      await moveStageMutation.mutateAsync({ stageId, position: toIndex });
      return;
    }

    const dealId = String(active.id);
    const destination = resolveDropTarget(funnel, String(over.id), dealId);
    if (!destination) return;

    const deal = findDeal(funnel, dealId);
    if (!deal) return;

    if (deal.stageId === destination.stageId && deal.position === destination.position) {
      return;
    }

    await moveDealMutation.mutateAsync({
      dealId,
      stageId: destination.stageId,
      position: destination.position,
    });
  };

  const stageIds = funnel.stages.map((stage) => stage.id);
  const selectedDeal = selectedDealId ? findDeal(funnel, selectedDealId) : null;
  const selectedStageName = selectedDeal
    ? (funnel.stages.find((stage) => stage.id === selectedDeal.stageId)?.name ?? '')
    : '';

  return (
    <>
      {funnel.stages.some((stage) => stage.truncated) ? (
        <p className="text-sm text-muted-foreground" role="status">
          В некоторых этапах загружена только часть сделок — нажмите «Загрузить ещё» внизу этапа.
        </p>
      ) : null}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="kanban-board">
          <SortableContext items={stageIds} strategy={horizontalListSortingStrategy}>
            {funnel.stages.map((stage) => (
              <SortableFunnelStage
                key={stage.id}
                stage={stage}
                workspaceId={workspaceId}
                funnelId={funnel.id}
                canDelete={funnel.stages.length > 1}
                onOpenDeal={setSelectedDealId}
              />
            ))}
          </SortableContext>
          <AddStagePanel workspaceId={workspaceId} funnelId={funnel.id} />
        </div>

        <DragOverlay>
          {activeStage ? (
            <div className="kanban-column kanban-column--dragging">
              <div className="kanban-column__header">
                <h3 className="kanban-column__title">{activeStage.name}</h3>
                <span className="kanban-column__count">{activeStage.deals.length}</span>
              </div>
            </div>
          ) : null}
          {activeDeal ? (
            <div className="kanban-task-card kanban-task-card--dragging crm-deal-card">
              <p className="kanban-task-card__title">{activeDeal.title}</p>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {selectedDeal ? (
        <DealDetailDrawer
          workspaceId={workspaceId}
          funnelId={funnel.id}
          deal={selectedDeal}
          stageName={selectedStageName}
          onClose={() => setSelectedDealId(null)}
        />
      ) : null}
    </>
  );
}

function SortableFunnelStage({
  stage,
  workspaceId,
  funnelId,
  canDelete,
  onOpenDeal,
}: {
  stage: FunnelStage;
  workspaceId: string;
  funnelId: string;
  canDelete: boolean;
  onOpenDeal: (dealId: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: stage.id,
    data: { type: 'stage' as const },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <FunnelStageColumn
        stage={stage}
        workspaceId={workspaceId}
        funnelId={funnelId}
        canDelete={canDelete}
        dragHandleProps={{ ...attributes, ...listeners }}
        onOpenDeal={onOpenDeal}
      />
    </div>
  );
}

function FunnelStageColumn({
  stage,
  workspaceId,
  funnelId,
  canDelete,
  dragHandleProps,
  onOpenDeal,
}: {
  stage: FunnelStage;
  workspaceId: string;
  funnelId: string;
  canDelete: boolean;
  dragHandleProps?: HTMLAttributes<HTMLElement>;
  onOpenDeal: (dealId: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.id });
  const createMutation = useCreateDealMutation(workspaceId, funnelId);
  const loadMoreMutation = useLoadMoreStageDealsMutation(workspaceId, funnelId);
  const { data: dealTemplates = [] } = useDealTemplatesQuery(workspaceId);
  const updateStageMutation = useUpdateStageMutation(workspaceId, funnelId);
  const deleteStageMutation = useDeleteStageMutation(workspaceId, funnelId);
  const [title, setTitle] = useState('');
  const [templateId, setTemplateId] = useState('');
  const [editingName, setEditingName] = useState(false);
  const [stageName, setStageName] = useState(stage.name);
  const dealIds = useMemo(() => stage.deals.map((deal) => deal.id), [stage.deals]);
  const remainingServer = Math.max(0, (stage.dealTotal ?? stage.deals.length) - stage.deals.length);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const selected = dealTemplates.find((template) => template.id === templateId);
    const nextTitle = title.trim() || selected?.title?.trim() || '';
    if (!nextTitle) return;
    await createMutation.mutateAsync({
      title: nextTitle,
      stageId: stage.id,
      ...(templateId ? { templateId } : {}),
    });
    setTitle('');
    setTemplateId('');
  };

  const handleRename = async () => {
    const next = stageName.trim();
    if (!next || next === stage.name) {
      setStageName(stage.name);
      setEditingName(false);
      return;
    }
    await updateStageMutation.mutateAsync({ stageId: stage.id, name: next });
    setEditingName(false);
  };

  const handleDelete = async () => {
    const message =
      stage.deals.length > 0
        ? `Удалить этап «${stage.name}» вместе с ${stage.deals.length} сделками?`
        : `Удалить этап «${stage.name}»?`;
    if (!window.confirm(message)) return;
    await deleteStageMutation.mutateAsync(stage.id);
  };

  return (
    <div ref={setNodeRef} className={`kanban-column ${isOver ? 'kanban-column--over' : ''}`}>
      <div className="kanban-column__header">
        <button
          type="button"
          className="kanban-column__drag"
          {...dragHandleProps}
          aria-label="Перетащить этап"
        >
          ⠿
        </button>

        {editingName ? (
          <input
            value={stageName}
            onChange={(event) => setStageName(event.target.value)}
            onBlur={handleRename}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                void handleRename();
              }
              if (event.key === 'Escape') {
                setStageName(stage.name);
                setEditingName(false);
              }
            }}
            className="kanban-column__title-input"
            autoFocus
            maxLength={80}
          />
        ) : (
          <button
            type="button"
            className="kanban-column__title"
            onClick={() => {
              setStageName(stage.name);
              setEditingName(true);
            }}
            title="Переименовать"
          >
            {stage.name}
          </button>
        )}

        <span className="kanban-column__count">
          {stage.truncated && stage.dealTotal
            ? `${stage.deals.length}/${stage.dealTotal}`
            : (stage.dealTotal ?? stage.deals.length)}
        </span>

        {canDelete ? (
          <button
            type="button"
            className="kanban-column__delete"
            onClick={handleDelete}
            disabled={deleteStageMutation.isPending}
            aria-label="Удалить этап"
          >
            ×
          </button>
        ) : null}
      </div>

      <SortableContext items={dealIds} strategy={verticalListSortingStrategy}>
        <VirtualizedColumnList
          items={stage.deals}
          getItemKey={(deal) => deal.id}
          estimateSize={84}
          footer={
            stage.truncated ? (
              <button
                type="button"
                className="kanban-column__show-more"
                disabled={loadMoreMutation.isPending}
                onClick={() => {
                  void loadMoreMutation.mutateAsync({
                    stageId: stage.id,
                    offset: stage.deals.length,
                  });
                }}
              >
                {loadMoreMutation.isPending ? 'Загрузка…' : `Загрузить ещё (${remainingServer})`}
              </button>
            ) : null
          }
        >
          {(deal) => <DealCard deal={deal} onOpenDeal={onOpenDeal} />}
        </VirtualizedColumnList>
      </SortableContext>

      <form onSubmit={handleSubmit} className="kanban-column__add">
        {dealTemplates.length > 0 ? (
          <select
            className="kanban-column__add-template"
            value={templateId}
            onChange={(event) => {
              const nextId = event.target.value;
              setTemplateId(nextId);
              const selected = dealTemplates.find((template) => template.id === nextId);
              if (selected?.title && !title.trim()) {
                setTitle(selected.title);
              }
            }}
            aria-label="Шаблон сделки"
          >
            <option value="">Без шаблона</option>
            {dealTemplates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.name}
              </option>
            ))}
          </select>
        ) : null}
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Сделка..."
          maxLength={200}
          className="kanban-column__add-input"
        />
        <button
          type="submit"
          disabled={
            createMutation.isPending ||
            !(title.trim() || dealTemplates.find((template) => template.id === templateId)?.title)
          }
          className="kanban-column__add-btn"
          aria-label="Добавить сделку"
        >
          +
        </button>
      </form>
    </div>
  );
}

const DealCard = memo(function DealCard({
  deal,
  onOpenDeal,
}: {
  deal: FunnelDeal;
  onOpenDeal: (dealId: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: deal.id,
    data: { type: 'deal' as const, stageId: deal.stageId },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const amountLabel = formatDealAmount(deal.amount);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="kanban-task-card crm-deal-card"
      onClick={() => onOpenDeal(deal.id)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onOpenDeal(deal.id);
        }
      }}
      role="button"
      tabIndex={0}
    >
      <div className="kanban-task-card__body">
        <button
          type="button"
          className="kanban-task-card__drag"
          {...attributes}
          {...listeners}
          onClick={(event) => event.stopPropagation()}
          aria-label="Перетащить сделку"
        >
          ⠿
        </button>
        <div className="min-w-0 flex-1">
          <p className="kanban-task-card__title">{deal.title}</p>
          {(amountLabel || deal.contactName || deal.companyName || deal.assignee) && (
            <div className="kanban-task-meta">
              {amountLabel ? (
                <span className="kanban-task-chip crm-deal-chip--amount">{amountLabel}</span>
              ) : null}
              {deal.contactName ? (
                <span className="kanban-task-chip">{deal.contactName}</span>
              ) : null}
              {deal.companyName ? (
                <span className="kanban-task-chip">{deal.companyName}</span>
              ) : null}
              {deal.assignee ? (
                <span className="kanban-task-chip">{deal.assignee.name.split(' ')[0]}</span>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

function AddStagePanel({ workspaceId, funnelId }: { workspaceId: string; funnelId: string }) {
  const createStageMutation = useCreateStageMutation(workspaceId, funnelId);
  const [name, setName] = useState('');

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name.trim()) return;
    await createStageMutation.mutateAsync(name.trim());
    setName('');
  };

  return (
    <form onSubmit={handleSubmit} className="kanban-add-column">
      <span className="kanban-add-column__label">Новый этап</span>
      <input
        value={name}
        onChange={(event) => setName(event.target.value)}
        placeholder="Название этапа"
        maxLength={80}
        className="kanban-add-column__input"
      />
      <button
        type="submit"
        disabled={!name.trim() || createStageMutation.isPending}
        className="kanban-add-column__btn"
      >
        {createStageMutation.isPending ? 'Добавление...' : '+ Добавить этап'}
      </button>
    </form>
  );
}

function findDeal(funnel: FunnelView, dealId: string) {
  for (const stage of funnel.stages) {
    const deal = stage.deals.find((item) => item.id === dealId);
    if (deal) return deal;
  }
  return null;
}

function resolveDropTarget(funnel: FunnelView, overId: string, dealId: string) {
  const stageMatch = funnel.stages.find((stage) => stage.id === overId);
  if (stageMatch) {
    const activeDeal = findDeal(funnel, dealId);
    if (activeDeal?.stageId === stageMatch.id) {
      return { stageId: stageMatch.id, position: Math.max(0, stageMatch.deals.length - 1) };
    }
    return { stageId: stageMatch.id, position: stageMatch.deals.length };
  }

  const overDeal = findDeal(funnel, overId);
  if (!overDeal) return null;

  const stage = funnel.stages.find((item) => item.id === overDeal.stageId);
  if (!stage) return null;

  const overIndex = stage.deals.findIndex((item) => item.id === overId);
  const activeDeal = findDeal(funnel, dealId);
  if (!activeDeal) return null;

  if (activeDeal.stageId === stage.id && overIndex > activeDeal.position) {
    return { stageId: stage.id, position: overIndex };
  }

  return { stageId: stage.id, position: overIndex };
}
