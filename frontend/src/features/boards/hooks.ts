import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { scheduleInvalidateQueries } from '@/shared/query/schedule-invalidate';
import {
  createBoard,
  createColumn,
  createComment,
  createTaskRelation,
  createTask,
  deleteBoard,
  deleteColumn,
  deleteComment,
  deleteTaskRelation,
  deleteTask,
  duplicateTask,
  fetchBoard,
  fetchBoards,
  fetchComments,
  fetchDefaultBoard,
  fetchTask,
  fetchTaskRelations,
  moveColumn,
  moveTask,
  updateBoard,
  updateColumn,
  updateColumnAutomations,
  updateTask,
  bulkUpdateTasks,
} from './api';
import type {
  BoardView,
  BulkUpdateTasksPayload,
  TaskRelationType,
  UpdateColumnAutomationsPayload,
  UpdateTaskPayload,
} from './types';

export const boardKeys = {
  all: ['boards'] as const,
  workspace: (workspaceId: string) => [...boardKeys.all, workspaceId] as const,
  list: (workspaceId: string) => [...boardKeys.workspace(workspaceId), 'list'] as const,
  detail: (workspaceId: string, boardId: string) =>
    [...boardKeys.workspace(workspaceId), 'board', boardId] as const,
  task: (workspaceId: string, taskId: string) =>
    [...boardKeys.all, workspaceId, 'task', taskId] as const,
  comments: (workspaceId: string, taskId: string) =>
    [...boardKeys.all, workspaceId, 'comments', taskId] as const,
  relations: (workspaceId: string, taskId: string) =>
    [...boardKeys.all, workspaceId, 'relations', taskId] as const,
};

export function invalidateWorkspaceBoards(
  queryClient: ReturnType<typeof useQueryClient>,
  workspaceId: string,
) {
  scheduleInvalidateQueries(queryClient, boardKeys.workspace(workspaceId));
}

function invalidateBoardAndLists(
  queryClient: ReturnType<typeof useQueryClient>,
  workspaceId: string,
  boardId?: string | null,
) {
  if (boardId) {
    scheduleInvalidateQueries(queryClient, boardKeys.detail(workspaceId, boardId));
  } else {
    invalidateWorkspaceBoards(queryClient, workspaceId);
  }
  scheduleInvalidateQueries(queryClient, ['all-tasks', workspaceId]);
}

export function useBoardsQuery(workspaceId: string | null) {
  return useQuery({
    queryKey: boardKeys.list(workspaceId ?? ''),
    queryFn: async () => {
      const response = await fetchBoards(workspaceId!);
      return response.data ?? [];
    },
    enabled: Boolean(workspaceId),
  });
}

export function useBoardQuery(
  workspaceId: string | null,
  boardId?: string | null,
  options?: { staleTime?: number },
) {
  return useQuery({
    queryKey: boardKeys.detail(workspaceId ?? '', boardId ?? 'default'),
    queryFn: async () => {
      if (boardId) {
        const response = await fetchBoard(workspaceId!, boardId);
        return response.data;
      }
      const response = await fetchDefaultBoard(workspaceId!);
      return response.data;
    },
    enabled: Boolean(workspaceId) && (boardId === undefined || Boolean(boardId)),
    staleTime: options?.staleTime ?? 60_000,
  });
}

export function useTaskDetailQuery(workspaceId: string | null, taskId: string | null) {
  return useQuery({
    queryKey: boardKeys.task(workspaceId ?? '', taskId ?? ''),
    queryFn: async () => {
      const response = await fetchTask(workspaceId!, taskId!);
      return response.data;
    },
    enabled: Boolean(workspaceId && taskId),
    staleTime: 30_000,
  });
}

export function useCreateBoardMutation(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: string | { name: string; templateId?: string }) => {
      const name = typeof input === 'string' ? input : input.name;
      const templateId = typeof input === 'string' ? undefined : input.templateId;
      const response = await createBoard(workspaceId, name, templateId);
      return response.data;
    },
    onSuccess: () => {
      scheduleInvalidateQueries(queryClient, boardKeys.list(workspaceId));
      scheduleInvalidateQueries(queryClient, ['all-tasks', workspaceId]);
    },
  });
}

export function useUpdateBoardMutation(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ boardId, name }: { boardId: string; name: string }) => {
      const response = await updateBoard(workspaceId, boardId, name);
      return response.data;
    },
    onSuccess: (_data, variables) => {
      scheduleInvalidateQueries(queryClient, boardKeys.list(workspaceId));
      scheduleInvalidateQueries(queryClient, boardKeys.detail(workspaceId, variables.boardId));
    },
  });
}

export function useDeleteBoardMutation(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (boardId: string) => {
      await deleteBoard(workspaceId, boardId);
    },
    onSuccess: () => {
      invalidateBoardAndLists(queryClient, workspaceId);
    },
  });
}

export function useCreateColumnMutation(workspaceId: string, boardId?: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (name: string) => {
      await createColumn(workspaceId, name, boardId ?? undefined);
    },
    onSuccess: () => {
      invalidateBoardAndLists(queryClient, workspaceId, boardId);
    },
  });
}

export function useUpdateColumnMutation(workspaceId: string, boardId?: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      columnId,
      name,
      wipLimit,
    }: {
      columnId: string;
      name?: string;
      wipLimit?: number | null;
    }) => {
      await updateColumn(workspaceId, columnId, { name, wipLimit });
    },
    onSuccess: () => {
      invalidateBoardAndLists(queryClient, workspaceId, boardId);
    },
  });
}

export function useUpdateColumnAutomationsMutation(workspaceId: string, boardId?: string | null) {
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
      if (boardId) {
        scheduleInvalidateQueries(queryClient, boardKeys.detail(workspaceId, boardId));
      } else {
        invalidateWorkspaceBoards(queryClient, workspaceId);
      }
    },
  });
}

export function useDeleteColumnMutation(workspaceId: string, boardId?: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (columnId: string) => {
      await deleteColumn(workspaceId, columnId);
    },
    onSuccess: () => {
      invalidateBoardAndLists(queryClient, workspaceId, boardId);
    },
  });
}

export function useMoveColumnMutation(workspaceId: string, boardId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ columnId, position }: { columnId: string; position: number }) => {
      await moveColumn(workspaceId, columnId, position);
    },
    onMutate: async ({ columnId, position }) => {
      const key = boardKeys.detail(workspaceId, boardId);
      await queryClient.cancelQueries({ queryKey: key });

      const previous = queryClient.getQueryData<BoardView>(key);
      if (previous) {
        queryClient.setQueryData(key, optimisticMoveColumn(previous, columnId, position));
      }

      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(boardKeys.detail(workspaceId, boardId), context.previous);
      }
    },
    onSettled: () => {
      invalidateBoardAndLists(queryClient, workspaceId, boardId);
    },
  });
}

export function useCreateTaskMutation(workspaceId: string, boardId?: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      title: string;
      columnId: string;
      description?: string;
      templateId?: string;
    }) => {
      await createTask(workspaceId, data);
    },
    onSuccess: () => {
      invalidateBoardAndLists(queryClient, workspaceId, boardId);
    },
  });
}

export function useMoveTaskMutation(workspaceId: string, boardId: string) {
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
      const key = boardKeys.detail(workspaceId, boardId);
      await queryClient.cancelQueries({ queryKey: key });

      const previous = queryClient.getQueryData<BoardView>(key);
      if (previous) {
        queryClient.setQueryData(key, optimisticMoveTask(previous, taskId, columnId, position));
      }

      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(boardKeys.detail(workspaceId, boardId), context.previous);
      }
    },
    onSettled: () => {
      invalidateBoardAndLists(queryClient, workspaceId, boardId);
    },
  });
}

export function useUpdateTaskMutation(workspaceId: string, boardId?: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskId, data }: { taskId: string; data: UpdateTaskPayload }) => {
      await updateTask(workspaceId, taskId, data);
    },
    onSuccess: () => {
      invalidateBoardAndLists(queryClient, workspaceId, boardId);
    },
  });
}

export function useBulkUpdateTasksMutation(workspaceId: string, boardId?: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: BulkUpdateTasksPayload) => {
      const response = await bulkUpdateTasks(workspaceId, data);
      return response.data!;
    },
    onSuccess: () => {
      invalidateBoardAndLists(queryClient, workspaceId, boardId);
    },
  });
}

export function useDeleteTaskMutation(workspaceId: string, boardId?: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (taskId: string) => {
      await deleteTask(workspaceId, taskId);
    },
    onSuccess: () => {
      invalidateBoardAndLists(queryClient, workspaceId, boardId);
      scheduleInvalidateQueries(queryClient, ['workspace-trash']);
    },
  });
}

export function useDuplicateTaskMutation(workspaceId: string, boardId?: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (taskId: string) => {
      const response = await duplicateTask(workspaceId, taskId);
      return response.data;
    },
    onSuccess: () => {
      invalidateBoardAndLists(queryClient, workspaceId, boardId);
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
