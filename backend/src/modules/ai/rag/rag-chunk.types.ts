export type RagChunkMetadata = {
  title: string;
  boardId: string;
  taskId: string;
  commentId?: string;
};

export function parseRagChunkMetadata(value: unknown): RagChunkMetadata | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  const title = typeof record.title === 'string' ? record.title.trim() : '';
  const boardId = typeof record.boardId === 'string' ? record.boardId : '';
  const taskId = typeof record.taskId === 'string' ? record.taskId : '';
  if (!boardId || !taskId) return null;
  const commentId = typeof record.commentId === 'string' ? record.commentId : undefined;
  return {
    title: title || 'Без названия',
    boardId,
    taskId,
    ...(commentId ? { commentId } : {}),
  };
}
