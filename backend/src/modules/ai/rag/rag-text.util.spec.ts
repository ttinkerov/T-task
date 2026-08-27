import { describe, expect, it } from 'vitest';
import {
  expandRetrievalQuery,
  formatVectorLiteral,
  maxMarginalRelevance,
  RAG_EMBEDDING_DIMENSIONS,
  reciprocalRankFusion,
  sha256Hex,
} from './rag.constants';
import {
  chunkText,
  commentToPlainText,
  contextualizeChunk,
  flattenDescriptionDoc,
  taskToPlainText,
} from './rag-text.util';

describe('rag-text.util', () => {
  it('flattens descriptionDoc blocks', () => {
    const text = flattenDescriptionDoc({
      type: 'doc',
      content: [
        { type: 'paragraph', content: [{ type: 'text', text: 'Hello' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'World' }] },
      ],
    });
    expect(text).toBe('Hello\nWorld');
  });

  it('builds task plain text preferring descriptionDoc', () => {
    expect(
      taskToPlainText({
        title: 'Ship RAG',
        description: 'plain',
        descriptionDoc: {
          type: 'doc',
          content: [{ type: 'paragraph', content: [{ type: 'text', text: 'from doc' }] }],
        },
      }),
    ).toBe('Ship RAG\n\nfrom doc');
  });

  it('chunks long text with overlap', () => {
    const long = Array.from({ length: 40 }, (_, i) => `Paragraph ${i}. ${'x'.repeat(80)}`).join(
      '\n\n',
    );
    const chunks = chunkText(long, 500, 50);
    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.every((c) => c.length <= 500)).toBe(true);
  });

  it('prefixes comment with task title', () => {
    expect(commentToPlainText({ body: 'LGTM', taskTitle: 'Review PR' })).toContain('Review PR');
  });

  it('adds contextual prefix for embedding', () => {
    expect(
      contextualizeChunk({
        sourceType: 'TASK',
        title: 'Ship RAG',
        chunk: 'Use hybrid retrieval',
      }),
    ).toBe('Задача: Ship RAG\n\nUse hybrid retrieval');
  });
});

describe('rag.constants helpers', () => {
  it('hashes content stably', () => {
    expect(sha256Hex('a')).toBe(sha256Hex('a'));
    expect(sha256Hex('a')).not.toBe(sha256Hex('b'));
  });

  it('formats only finite numeric embeddings as pg float8[] literals', () => {
    const embedding = Array.from({ length: RAG_EMBEDDING_DIMENSIONS }, (_, i) => i * 0.001);
    expect(formatVectorLiteral(embedding)).toMatch(/^\{[\d.,-]+\}$/);
    expect(() => formatVectorLiteral([1, 2, 3])).toThrow(/dimension mismatch/i);
    expect(() =>
      formatVectorLiteral(Array.from({ length: RAG_EMBEDDING_DIMENSIONS }, () => Number.NaN)),
    ).toThrow(/non-finite/i);
  });

  it('fuses ranks with RRF', () => {
    const fused = reciprocalRankFusion([
      ['a', 'b', 'c'],
      ['b', 'd', 'a'],
    ]);
    expect(fused[0]?.id).toBe('b');
    expect(fused.map((item) => item.id)).toEqual(expect.arrayContaining(['a', 'd']));
  });

  it('expands retrieval query without duplicates', () => {
    expect(expandRetrievalQuery(['hello', 'Hello', 'world', ''])).toBe('hello\nworld');
  });

  it('applies MMR diversification', () => {
    const selected = maxMarginalRelevance(
      [
        { key: 'a', snippet: 'alpha beta gamma', score: 1 },
        { key: 'b', snippet: 'alpha beta gamma delta', score: 0.95 },
        { key: 'c', snippet: 'zeta omega unique', score: 0.7 },
      ],
      2,
      0.5,
    );
    expect(selected.map((item) => item.key)).toEqual(['a', 'c']);
  });
});
