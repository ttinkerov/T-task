import { Prisma } from '@prisma/client';

export const DEFAULT_FUNNEL_STAGES = [
  'Новая',
  'Квалификация',
  'Предложение',
  'Переговоры',
  'Успех',
] as const;

export async function createDefaultFunnel(
  tx: Prisma.TransactionClient,
  workspaceId: string,
  name = 'Продажи',
) {
  const funnel = await tx.funnel.create({
    data: {
      workspaceId,
      name,
    },
  });

  await Promise.all(
    DEFAULT_FUNNEL_STAGES.map((stageName, index) =>
      tx.funnelStage.create({
        data: {
          funnelId: funnel.id,
          name: stageName,
          position: index,
        },
      }),
    ),
  );

  return funnel;
}
