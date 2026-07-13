import { Prisma } from '@prisma/client';

export const DEFAULT_BOARD_COLUMNS = ['Бэклог', 'В работе', 'Готово'] as const;

export async function createDefaultBoard(
  tx: Prisma.TransactionClient,
  workspaceId: string,
  name = 'Доска',
) {
  const board = await tx.board.create({
    data: {
      workspaceId,
      name,
    },
  });

  await Promise.all(
    DEFAULT_BOARD_COLUMNS.map((columnName, index) =>
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
