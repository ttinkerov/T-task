import { Prisma } from '@prisma/client';
import { getFunnelTemplate } from '../templates/funnel-templates';

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
  templateId?: string | null,
) {
  const template = getFunnelTemplate(templateId);
  const stages = template.stages.length > 0 ? template.stages : [...DEFAULT_FUNNEL_STAGES];

  const funnel = await tx.funnel.create({
    data: {
      workspaceId,
      name: name || template.name,
    },
  });

  await Promise.all(
    stages.map((stageName, index) =>
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
