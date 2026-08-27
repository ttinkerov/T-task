import { Prisma } from '@prisma/client';

/**
 * Builds a single parameterised CASE UPDATE that repositions multiple rows by id
 * in one round-trip. `table` must be a trusted compile-time constant, never user input.
 */
export function buildReorderSql(
  table: string,
  entries: { id: string; position: number }[],
): Prisma.Sql {
  const cases = Prisma.join(
    entries.map((e) => Prisma.sql`WHEN id = ${e.id} THEN ${e.position}`),
    ' ',
  );
  const ids = Prisma.join(entries.map((e) => e.id));
  return Prisma.sql`UPDATE ${Prisma.raw(table)} SET position = CASE ${cases} END WHERE id IN (${ids})`;
}

export function buildColumnReorderSql(entries: { id: string; position: number }[]): Prisma.Sql {
  return buildReorderSql('board_columns', entries);
}

export function buildTaskReorderSql(entries: { id: string; position: number }[]): Prisma.Sql {
  return buildReorderSql('tasks', entries);
}

export function buildFunnelStageReorderSql(
  entries: { id: string; position: number }[],
): Prisma.Sql {
  return buildReorderSql('funnel_stages', entries);
}
