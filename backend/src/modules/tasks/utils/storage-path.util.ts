import { join, resolve, sep } from 'path';

function isInsideRoot(rootResolved: string, candidate: string): boolean {
  return candidate === rootResolved || candidate.startsWith(`${rootResolved}${sep}`);
}

export function resolveUnderRoot(root: string, ...segments: string[]): string {
  const rootResolved = resolve(root);
  const candidate = resolve(join(rootResolved, ...segments));

  if (!isInsideRoot(rootResolved, candidate)) {
    throw new Error('Path escapes upload root');
  }

  return candidate;
}

export function assertPathInsideRoot(root: string, absolutePath: string): string {
  const rootResolved = resolve(root);
  const candidate = resolve(absolutePath);

  if (!isInsideRoot(rootResolved, candidate)) {
    throw new Error('Path escapes upload root');
  }

  return candidate;
}
