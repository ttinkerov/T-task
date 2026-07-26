import { existsSync } from 'node:fs';

export function assertSecureRuntime(nodeEnv: string | undefined): void {
  if (nodeEnv === 'production' || nodeEnv === 'test') {
    return;
  }

  const allowInsecure =
    process.env.ALLOW_INSECURE_DEV === 'true' || process.env.ALLOW_INSECURE_DEV === '1';
  if (allowInsecure) {
    return;
  }

  if (existsSync('/.dockerenv')) {
    throw new Error(
      'Refusing to start with NODE_ENV!="production" inside Docker. ' +
        'Deploy with: docker compose -f docker-compose.yml -f docker-compose.prod.yml up --build. ' +
        'For local insecure Docker stacks set ALLOW_INSECURE_DEV=true.',
    );
  }
}
