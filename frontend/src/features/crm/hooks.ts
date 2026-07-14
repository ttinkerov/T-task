import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createDeal,
  createFunnel,
  createStage,
  deleteDeal,
  deleteStage,
  fetchFunnel,
  fetchFunnels,
  moveDeal,
  moveStage,
  updateDeal,
  updateStage,
} from './api';
import type { FunnelView, UpdateDealPayload } from './types';

export const crmKeys = {
  all: ['crm'] as const,
  funnels: (workspaceId: string) => [...crmKeys.all, workspaceId, 'funnels'] as const,
  funnel: (workspaceId: string, funnelId: string) =>
    [...crmKeys.all, workspaceId, 'funnel', funnelId] as const,
};

export function useFunnelsQuery(workspaceId: string | null) {
  return useQuery({
    queryKey: crmKeys.funnels(workspaceId ?? ''),
    queryFn: async () => {
      const response = await fetchFunnels(workspaceId!);
      return response.data ?? [];
    },
    enabled: Boolean(workspaceId),
  });
}

export function useFunnelQuery(workspaceId: string | null, funnelId: string | null) {
  return useQuery({
    queryKey: crmKeys.funnel(workspaceId ?? '', funnelId ?? ''),
    queryFn: async () => {
      const response = await fetchFunnel(workspaceId!, funnelId!);
      return response.data;
    },
    enabled: Boolean(workspaceId && funnelId),
  });
}

export function useCreateFunnelMutation(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (name: string) => {
      const response = await createFunnel(workspaceId, name);
      return response.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: crmKeys.funnels(workspaceId) });
    },
  });
}

export function useCreateStageMutation(workspaceId: string, funnelId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (name: string) => {
      await createStage(workspaceId, funnelId, name);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: crmKeys.funnel(workspaceId, funnelId) });
    },
  });
}

export function useUpdateStageMutation(workspaceId: string, funnelId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ stageId, name }: { stageId: string; name: string }) => {
      await updateStage(workspaceId, funnelId, stageId, name);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: crmKeys.funnel(workspaceId, funnelId) });
    },
  });
}

export function useDeleteStageMutation(workspaceId: string, funnelId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (stageId: string) => {
      await deleteStage(workspaceId, funnelId, stageId);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: crmKeys.funnel(workspaceId, funnelId) });
    },
  });
}

export function useMoveStageMutation(workspaceId: string, funnelId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ stageId, position }: { stageId: string; position: number }) => {
      await moveStage(workspaceId, funnelId, stageId, position);
    },
    onMutate: async ({ stageId, position }) => {
      const key = crmKeys.funnel(workspaceId, funnelId);
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<FunnelView>(key);
      if (previous) {
        queryClient.setQueryData(key, optimisticMoveStage(previous, stageId, position));
      }
      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(crmKeys.funnel(workspaceId, funnelId), context.previous);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: crmKeys.funnel(workspaceId, funnelId) });
    },
  });
}

export function useCreateDealMutation(workspaceId: string, funnelId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { title: string; stageId: string; description?: string }) => {
      await createDeal(workspaceId, data);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: crmKeys.funnel(workspaceId, funnelId) });
    },
  });
}

export function useMoveDealMutation(workspaceId: string, funnelId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      dealId,
      stageId,
      position,
    }: {
      dealId: string;
      stageId: string;
      position: number;
    }) => {
      await moveDeal(workspaceId, dealId, { stageId, position });
    },
    onMutate: async ({ dealId, stageId, position }) => {
      const key = crmKeys.funnel(workspaceId, funnelId);
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<FunnelView>(key);
      if (previous) {
        queryClient.setQueryData(key, optimisticMoveDeal(previous, dealId, stageId, position));
      }
      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(crmKeys.funnel(workspaceId, funnelId), context.previous);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: crmKeys.funnel(workspaceId, funnelId) });
    },
  });
}

export function useUpdateDealMutation(workspaceId: string, funnelId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ dealId, data }: { dealId: string; data: UpdateDealPayload }) => {
      await updateDeal(workspaceId, dealId, data);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: crmKeys.funnel(workspaceId, funnelId) });
    },
  });
}

export function useDeleteDealMutation(workspaceId: string, funnelId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dealId: string) => {
      await deleteDeal(workspaceId, dealId);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: crmKeys.funnel(workspaceId, funnelId) });
    },
  });
}

function optimisticMoveStage(
  funnel: FunnelView,
  stageId: string,
  targetPosition: number,
): FunnelView {
  const stages = [...funnel.stages];
  const fromIndex = stages.findIndex((stage) => stage.id === stageId);
  if (fromIndex < 0) return funnel;

  const [moving] = stages.splice(fromIndex, 1);
  stages.splice(targetPosition, 0, moving);

  return {
    ...funnel,
    stages: stages.map((stage, index) => ({ ...stage, position: index })),
  };
}

function optimisticMoveDeal(
  funnel: FunnelView,
  dealId: string,
  targetStageId: string,
  targetPosition: number,
): FunnelView {
  let movingDeal: FunnelView['stages'][number]['deals'][number] | null = null;

  const stagesWithoutDeal = funnel.stages.map((stage) => {
    const deals = stage.deals.filter((deal) => {
      if (deal.id === dealId) {
        movingDeal = deal;
        return false;
      }
      return true;
    });

    return {
      ...stage,
      deals: deals.map((deal, index) => ({ ...deal, position: index })),
    };
  });

  if (!movingDeal) {
    return funnel;
  }

  return {
    ...funnel,
    stages: stagesWithoutDeal.map((stage) => {
      if (stage.id !== targetStageId) {
        return stage;
      }

      const deals = [...stage.deals];
      deals.splice(targetPosition, 0, {
        ...movingDeal!,
        stageId: targetStageId,
        position: targetPosition,
      });

      return {
        ...stage,
        deals: deals.map((deal, index) => ({ ...deal, position: index, stageId: stage.id })),
      };
    }),
  };
}
