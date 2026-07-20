import { Prisma } from '@prisma/client';
import { getBoardTemplate } from '../templates/board-templates';

export const DEFAULT_BOARD_COLUMNS = ['Бэклог', 'В работе', 'Готово'] as const;

export async function createDefaultBoard(
  tx: Prisma.TransactionClient,
  workspaceId: string,
  name = 'Доска',
  templateId?: string | null,
) {
  const template = getBoardTemplate(templateId);
  const columns = template.columns.length > 0 ? template.columns : [...DEFAULT_BOARD_COLUMNS];

  const board = await tx.board.create({
    data: {
      workspaceId,
      name,
    },
  });

  await Promise.all(
    columns.map((columnName, index) =>
      tx.boardColumn.create({
        data: {
          boardId: board.id,
          name: columnName,
          position: index,
        },
      }),
    ),
  );

  return board;
}
