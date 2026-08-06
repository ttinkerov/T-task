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
import { memo, useCallback, useEffect, useMemo, useState, type HTMLAttributes } from 'react';
import { VueIsland } from '@/components/vue/VueIsland';
import { BoardEmptyState } from '@/features/boards/components/board-empty-state';
import { useDealTemplatesQuery } from '@/features/templates';
import { VirtualizedColumnList } from '@/shared/ui/virtualized-column-list';
import AddStagePanelView from '@/vue/crm/AddStagePanel.vue';
import CrmDragOverlayView from '@/vue/crm/CrmDragOverlay.vue';
import DealCardBodyView from '@/vue/crm/DealCardBody.vue';
import FunnelAddDealFormView from '@/vue/crm/FunnelAddDealForm.vue';
import FunnelStageHeaderView from '@/vue/crm/FunnelStageHeader.vue';
import FunnelToolbarView from '@/vue/crm/FunnelToolbar.vue';
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
  const createFunnelMutation = useCreateFunnelMutation(workspaceId);

  useEffect(() => {
    if (!funnelId && funnels.length > 0) {
      setFunnelId(funnels[0].id);
    }
  }, [funnelId, funnels]);

  const onCreateFunnel = useCallback(
    async (name: string) => {
      const created = await createFunnelMutation.mutateAsync(name);
      if (created?.id) setFunnelId(created.id);
    },
    [createFunnelMutation],
  );

  const onCreateEmptyFunnel = useCallback(() => {
    void createFunnelMutation.mutateAsync('Основная воронка').then((created) => {
      if (created?.id) setFunnelId(created.id);
    });
  }, [createFunnelMutation]);

  const funnelOptions = useMemo(
    () => funnels.map((item) => ({ id: item.id, name: item.name })),
    [funnels],
  );

  const toolbarProps = useMemo(
    () => ({
      funnels: funnelOptions,
      funnelId: funnelId ?? '',
      showActions: funnels.length > 0,
      createPending: createFunnelMutation.isPending,
      onFunnelChange: setFunnelId,
      onCreate: onCreateFunnel,
    }),
    [funnelOptions, funnelId, funnels.length, createFunnelMutation.isPending, onCreateFunnel],
  );

  if (funnelsLoading) {
    return <p className="text-sm text-muted-foreground">Загрузка воронок...</p>;
  }

  if (funnels.length === 0) {
    return (
      <div className="crm-page">
        <VueIsland
          component={FunnelToolbarView}
          componentProps={{ funnels: [], funnelId: '', showActions: false }}
        />
        <BoardEmptyState
          className="empty-state--board"
          icon="clipboard-list"
          title="Создайте первую воронку"
          description="Воронка — это этапы продаж. Добавьте сделки и двигайте их к закрытию."
          actionLabel="Создать воронку"
          actionPending={createFunnelMutation.isPending}
          onAction={onCreateEmptyFunnel}
        />
      </div>
    );
  }

  return (
    <div className="crm-page">
      <VueIsland component={FunnelToolbarView} componentProps={toolbarProps} />

      {funnelLoading || !funnel || !funnelId ? (
        <p className="text-sm text-muted-foreground">Загрузка воронки...</p>
      ) : (
        <FunnelBoardView workspaceId={workspaceId} funnel={funnel} />
      )}
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

  const overlayProps = useMemo(
    () => ({
      stageName: activeStage?.name ?? '',
      stageCount: activeStage?.deals.length ?? 0,
      dealTitle: activeDeal?.title ?? '',
    }),
    [activeStage?.name, activeStage?.deals.length, activeDeal?.title],
  );

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
          {activeStage || activeDeal ? (
            <VueIsland component={CrmDragOverlayView} componentProps={overlayProps} />
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
  const dealIds = useMemo(() => stage.deals.map((deal) => deal.id), [stage.deals]);
  const remainingServer = Math.max(0, (stage.dealTotal ?? stage.deals.length) - stage.deals.length);

  const countLabel =
    stage.truncated && stage.dealTotal
      ? `${stage.deals.length}/${stage.dealTotal}`
      : String(stage.dealTotal ?? stage.deals.length);

  const onRename = useCallback(
    async (raw: string) => {
      const next = raw.trim();
      if (!next || next === stage.name) return;
      await updateStageMutation.mutateAsync({ stageId: stage.id, name: next });
    },
    [stage.id, stage.name, updateStageMutation],
  );

  const onDelete = useCallback(async () => {
    const message =
      stage.deals.length > 0
        ? `Удалить этап «${stage.name}» вместе с ${stage.deals.length} сделками?`
        : `Удалить этап «${stage.name}»?`;
    if (!window.confirm(message)) return;
    await deleteStageMutation.mutateAsync(stage.id);
  }, [deleteStageMutation, stage.deals.length, stage.id, stage.name]);

  const templates = useMemo(
    () =>
      dealTemplates.map((template) => ({
        id: template.id,
        name: template.name,
        title: template.title,
      })),
    [dealTemplates],
  );

  const onCreateDeal = useCallback(
    async (payload: { title: string; templateId?: string }) => {
      await createMutation.mutateAsync({
        title: payload.title,
        stageId: stage.id,
        ...(payload.templateId ? { templateId: payload.templateId } : {}),
      });
    },
    [createMutation, stage.id],
  );

  const headerProps = useMemo(
    () => ({
      name: stage.name,
      countLabel,
      onRename,
    }),
    [stage.name, countLabel, onRename],
  );

  const addDealProps = useMemo(
    () => ({
      templates,
      pending: createMutation.isPending,
      onCreate: onCreateDeal,
    }),
    [templates, createMutation.isPending, onCreateDeal],
  );

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

        <VueIsland component={FunnelStageHeaderView} componentProps={headerProps} displayContents />

        {canDelete ? (
          <button
            type="button"
            className="kanban-column__delete"
            onClick={() => void onDelete()}
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

      <VueIsland component={FunnelAddDealFormView} componentProps={addDealProps} />
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

  const viewProps = useMemo(
    () => ({
      title: deal.title,
      amountLabel: formatDealAmount(deal.amount) ?? '',
      contactName: deal.contactName ?? '',
      companyName: deal.companyName ?? '',
      assigneeName: deal.assignee?.name.split(' ')[0] ?? '',
    }),
    [deal.title, deal.amount, deal.contactName, deal.companyName, deal.assignee?.name],
  );

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
          style={{ order: 2 }}
          {...attributes}
          {...listeners}
          onClick={(event) => event.stopPropagation()}
          aria-label="Перетащить сделку"
        >
          ⠿
        </button>
        <VueIsland component={DealCardBodyView} componentProps={viewProps} displayContents />
      </div>
    </div>
  );
});

function AddStagePanel({ workspaceId, funnelId }: { workspaceId: string; funnelId: string }) {
  const createStageMutation = useCreateStageMutation(workspaceId, funnelId);

  const onCreate = useCallback(
    async (name: string) => {
      await createStageMutation.mutateAsync(name);
    },
    [createStageMutation],
  );

  const viewProps = useMemo(
    () => ({
      pending: createStageMutation.isPending,
      onCreate,
    }),
    [createStageMutation.isPending, onCreate],
  );

  return <VueIsland component={AddStagePanelView} componentProps={viewProps} />;
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
