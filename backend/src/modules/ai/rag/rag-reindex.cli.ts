import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../../app.module';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { RagIndexerService } from './rag-indexer.service';

async function main() {
  const logger = new Logger('RagReindexCli');
  const args = process.argv.slice(2);
  const all = args.includes('--all');
  const workspaceFlag = args.indexOf('--workspace');
  const workspaceId =
    workspaceFlag >= 0 && args[workspaceFlag + 1] ? args[workspaceFlag + 1] : null;

  if (!all && !workspaceId) {
    logger.error('Pass --all or --workspace <id>');
    process.exitCode = 1;
    return;
  }

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  try {
    const prisma = app.get(PrismaService);
    const indexer = app.get(RagIndexerService);

    const ids = workspaceId
      ? [workspaceId]
      : (
          await prisma.aiWorkspaceSetting.findMany({
            select: { workspaceId: true },
          })
        ).map((row) => row.workspaceId);

    for (const id of ids) {
      logger.log(`Reindexing workspace ${id}…`);
      const counts = await indexer.reindexWorkspace(id);
      logger.log(`Done ${id}: tasks=${counts.tasks} comments=${counts.comments}`);
    }
  } finally {
    await app.close();
  }
}

void main();
