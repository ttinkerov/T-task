import { createHash } from 'node:crypto';

export const RAG_EMBEDDING_DIMENSIONS = 1536;
export const RAG_DEFAULT_EMBEDDING_MODEL = 'text-embedding-3-small';

export const RAG_CHUNK_MAX_CHARS = 1200;
export const RAG_CHUNK_OVERLAP_CHARS = 180;
export const RAG_CANDIDATE_LIMIT = 40;
export const RAG_RETRIEVE_TOP_K = 8;
export const RAG_CONTEXT_MAX_CHARS = 10_000;
export const RAG_EMBED_BATCH_SIZE = 16;
export const RAG_MIN_VECTOR_SCORE = 0.18;
export const RAG_MMR_LAMBDA = 0.72;

export function sha256Hex(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex');
}

export function formatVectorLiteral(embedding: number[]): string {
  if (embedding.length !== RAG_EMBEDDING_DIMENSIONS) {
    throw new Error(
      `Embedding dimension mismatch: expected ${RAG_EMBEDDING_DIMENSIONS}, got ${embedding.length}`,
    );
  }
  for (const value of embedding) {
    if (!Number.isFinite(value)) {
      throw new Error('Embedding contains non-finite values');
    }
  }
  return `{${embedding.map((value) => Number(value).toString()).join(',')}}`;
}

export function reciprocalRankFusion(
  rankedLists: string[][],
  k = 60,
): Array<{ id: string; score: number }> {
  const scores = new Map<string, number>();
  for (const list of rankedLists) {
    const seen = new Set<string>();
    list.forEach((id, index) => {
      if (seen.has(id)) return;
      seen.add(id);
      const next = (scores.get(id) ?? 0) + 1 / (k + index + 1);
      scores.set(id, next);
    });
  }
  return [...scores.entries()]
    .map(([id, score]) => ({ id, score }))
    .sort((a, b) => b.score - a.score);
}

export function tokenizeForOverlap(text: string): Set<string> {
  return new Set(
    text
      .toLocaleLowerCase('ru-RU')
      .split(/[^\p{L}\p{N}]+/u)
      .filter((token) => token.length > 2),
  );
}

export function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 1;
  if (a.size === 0 || b.size === 0) return 0;
  let intersection = 0;
  for (const token of a) {
    if (b.has(token)) intersection += 1;
  }
  return intersection / (a.size + b.size - intersection);
}

export function maxMarginalRelevance<T extends { key: string; snippet: string; score: number }>(
  candidates: T[],
  topK: number,
  lambda = RAG_MMR_LAMBDA,
): T[] {
  if (candidates.length <= topK) return candidates;

  const remaining = [...candidates];
  const selected: T[] = [];
  const tokenCache = new Map<string, Set<string>>();

  const tokensOf = (item: T) => {
    let cached = tokenCache.get(item.key);
    if (!cached) {
      cached = tokenizeForOverlap(item.snippet);
      tokenCache.set(item.key, cached);
    }
    return cached;
  };

  while (selected.length < topK && remaining.length > 0) {
    let bestIndex = 0;
    let bestScore = Number.NEGATIVE_INFINITY;

    for (let i = 0; i < remaining.length; i += 1) {
      const candidate = remaining[i]!;
      const relevance = candidate.score;
      let maxSim = 0;
      for (const picked of selected) {
        maxSim = Math.max(maxSim, jaccardSimilarity(tokensOf(candidate), tokensOf(picked)));
      }
      const mmr = lambda * relevance - (1 - lambda) * maxSim;
      if (mmr > bestScore) {
        bestScore = mmr;
        bestIndex = i;
      }
    }

    selected.push(remaining.splice(bestIndex, 1)[0]!);
  }

  return selected;
}

export function expandRetrievalQuery(parts: string[]): string {
  const unique: string[] = [];
  const seen = new Set<string>();
  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const key = trimmed.toLocaleLowerCase('ru-RU');
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(trimmed);
  }
  return unique.join('\n').slice(0, 2000);
}
