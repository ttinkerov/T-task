import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createColumn,
  createTask,
  deleteTask,
  fetchBoard,
  moveColumn,
  moveTask,
  updateTask,
} from './api';
import type { BoardView, UpdateTaskPayload } from './types';

export const boardKeys = {
  all: ['boards'] as const,
  detail: (workspaceId: string) => [...boardKeys.all, workspaceId, 'board'] as const,
};

export function useBoardQuery(workspaceId: string | null) {
  return useQuery({
    queryKey: boardKeys.detail(workspaceId ?? ''),
    queryFn: async () => {
      const response = await fetchBoard(workspaceId!);
      return response.data;
    },
    enabled: Boolean(workspaceId),
  });
}

export function useCreateColumnMutation(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (name: string) => {
      await createColumn(workspaceId, name);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: boardKeys.detail(workspaceId) });
    },
  });
}

export function useMoveColumnMutation(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ columnId, position }: { columnId: string; position: number }) => {
      await moveColumn(workspaceId, columnId, position);
    },
    onMutate: async ({ columnId, position }) => {
      const key = boardKeys.detail(workspaceId);
      await queryClient.cancelQueries({ queryKey: key });

      const previous = queryClient.getQueryData<BoardView>(key);
      if (previous) {
        queryClient.setQueryData(key, optimisticMoveColumn(previous, columnId, position));
      }

      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(boardKeys.detail(workspaceId), context.previous);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: boardKeys.detail(workspaceId) });
    },
  });
}

export function useCreateTaskMutation(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { title: string; columnId: string; description?: string }) => {
      await createTask(workspaceId, data);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: boardKeys.detail(workspaceId) });
    },
  });
}

export function useMoveTaskMutation(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      taskId,
      columnId,
      position,
    }: {
      taskId: string;
      columnId: string;
      position: number;
    }) => {
      await moveTask(workspaceId, taskId, { columnId, position });
    },
    onMutate: async ({ taskId, columnId, position }) => {
      const key = boardKeys.detail(workspaceId);
      await queryClient.cancelQueries({ queryKey: key });

      const previous = queryClient.getQueryData<BoardView>(key);
      if (previous) {
        queryClient.setQueryData(key, optimisticMoveTask(previous, taskId, columnId, position));
      }

      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(boardKeys.detail(workspaceId), context.previous);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: boardKeys.detail(workspaceId) });
    },
  });
}

export function useUpdateTaskMutation(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskId, data }: { taskId: string; data: UpdateTaskPayload }) => {
      await updateTask(workspaceId, taskId, data);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: boardKeys.detail(workspaceId) });
    },
  });
}

export function useDeleteTaskMutation(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (taskId: string) => {
      await deleteTask(workspaceId, taskId);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: boardKeys.detail(workspaceId) });
    },
  });
}

function optimisticMoveColumn(
  board: BoardView,
  columnId: string,
  targetPosition: number,
): BoardView {
  const columns = [...board.columns];
  const fromIndex = columns.findIndex((column) => column.id === columnId);
  if (fromIndex < 0) return board;

  const [moving] = columns.splice(fromIndex, 1);
  columns.splice(targetPosition, 0, moving);

  return {
    ...board,
    columns: columns.map((column, index) => ({ ...column, position: index })),
  };
}

function optimisticMoveTask(
  board: BoardView,
  taskId: string,
  targetColumnId: string,
  targetPosition: number,
): BoardView {
  let movingTask: BoardView['columns'][number]['tasks'][number] | null = null;

  const columnsWithoutTask = board.columns.map((column) => {
    const tasks = column.tasks.filter((task) => {
      if (task.id === taskId) {
        movingTask = task;
        return false;
      }
      return true;
    });

    return {
      ...column,
      tasks: tasks.map((task, index) => ({ ...task, position: index })),
    };
  });

  if (!movingTask) {
    return board;
  }

  return {
    ...board,
    columns: columnsWithoutTask.map((column) => {
      if (column.id !== targetColumnId) {
        return column;
      }

      const tasks = [...column.tasks];
      tasks.splice(targetPosition, 0, {
        ...movingTask!,
        columnId: targetColumnId,
        position: targetPosition,
      });

      return {
        ...column,
        tasks: tasks.map((task, index) => ({ ...task, position: index, columnId: column.id })),
      };
    }),
  };
}
