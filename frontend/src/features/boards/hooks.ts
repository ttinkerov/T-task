import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createColumn,
  createComment,
  createTaskRelation,
  createTask,
  deleteColumn,
  deleteComment,
  deleteTaskRelation,
  deleteTask,
  duplicateTask,
  fetchBoard,
  fetchComments,
  fetchTaskRelations,
  moveColumn,
  moveTask,
  updateColumn,
  updateColumnAutomations,
  updateTask,
} from './api';
import type {
  BoardView,
  TaskRelationType,
  UpdateColumnAutomationsPayload,
  UpdateTaskPayload,
} from './types';

export const boardKeys = {
  all: ['boards'] as const,
  detail: (workspaceId: string) => [...boardKeys.all, workspaceId, 'board'] as const,
  comments: (workspaceId: string, taskId: string) =>
    [...boardKeys.all, workspaceId, 'comments', taskId] as const,
  relations: (workspaceId: string, taskId: string) =>
    [...boardKeys.all, workspaceId, 'relations', taskId] as const,
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
      void queryClient.invalidateQueries({ queryKey: ['all-tasks', workspaceId] });
    },
  });
}

export function useUpdateColumnMutation(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ columnId, name }: { columnId: string; name: string }) => {
      await updateColumn(workspaceId, columnId, name);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: boardKeys.detail(workspaceId) });
      void queryClient.invalidateQueries({ queryKey: ['all-tasks', workspaceId] });
    },
  });
}

export function useUpdateColumnAutomationsMutation(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      columnId,
      data,
    }: {
      columnId: string;
      data: UpdateColumnAutomationsPayload;
    }) => {
      await updateColumnAutomations(workspaceId, columnId, data);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: boardKeys.detail(workspaceId) });
    },
  });
}

export function useDeleteColumnMutation(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (columnId: string) => {
      await deleteColumn(workspaceId, columnId);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: boardKeys.detail(workspaceId) });
      void queryClient.invalidateQueries({ queryKey: ['all-tasks', workspaceId] });
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
      void queryClient.invalidateQueries({ queryKey: ['all-tasks', workspaceId] });
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
      void queryClient.invalidateQueries({ queryKey: ['all-tasks', workspaceId] });
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
      void queryClient.invalidateQueries({ queryKey: ['all-tasks', workspaceId] });
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
      void queryClient.invalidateQueries({ queryKey: ['all-tasks', workspaceId] });
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
      void queryClient.invalidateQueries({ queryKey: ['all-tasks', workspaceId] });
      void queryClient.invalidateQueries({ queryKey: ['workspace-trash'] });
    },
  });
}

export function useDuplicateTaskMutation(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (taskId: string) => {
      const response = await duplicateTask(workspaceId, taskId);
      return response.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: boardKeys.detail(workspaceId) });
      void queryClient.invalidateQueries({ queryKey: ['all-tasks', workspaceId] });
    },
  });
}

export function useCommentsQuery(workspaceId: string, taskId: string) {
  return useQuery({
    queryKey: boardKeys.comments(workspaceId, taskId),
    queryFn: async () => {
      const response = await fetchComments(workspaceId, taskId);
      return response.data ?? [];
    },
    enabled: Boolean(workspaceId && taskId),
  });
}

export function useCreateCommentMutation(workspaceId: string, taskId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (body: string) => {
      await createComment(workspaceId, taskId, body);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: boardKeys.comments(workspaceId, taskId),
      });
    },
  });
}

export function useDeleteCommentMutation(workspaceId: string, taskId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (commentId: string) => {
      await deleteComment(workspaceId, taskId, commentId);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: boardKeys.comments(workspaceId, taskId),
      });
    },
  });
}

export function useTaskRelationsQuery(workspaceId: string, taskId: string) {
  return useQuery({
    queryKey: boardKeys.relations(workspaceId, taskId),
    queryFn: async () => {
      const response = await fetchTaskRelations(workspaceId, taskId);
      return response.data ?? [];
    },
    enabled: Boolean(workspaceId && taskId),
  });
}

export function useCreateTaskRelationMutation(workspaceId: string, taskId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { relatedTaskId: string; type: TaskRelationType }) =>
      createTaskRelation(workspaceId, taskId, data),
    onSuccess: (_response, variables) => {
      for (const relatedTaskId of [taskId, variables.relatedTaskId]) {
        void queryClient.invalidateQueries({
          queryKey: boardKeys.relations(workspaceId, relatedTaskId),
        });
      }
    },
  });
}

export function useDeleteTaskRelationMutation(workspaceId: string, taskId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ relationId }: { relationId: string; relatedTaskId: string }) =>
      deleteTaskRelation(workspaceId, taskId, relationId),
    onSuccess: (_response, variables) => {
      for (const relatedTaskId of [taskId, variables.relatedTaskId]) {
        void queryClient.invalidateQueries({
          queryKey: boardKeys.relations(workspaceId, relatedTaskId),
        });
      }
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
