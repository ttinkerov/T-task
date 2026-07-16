import { describe, expect, it } from 'vitest';
import { normalizeExternalAppUrl } from './external-app-url.util';

describe('normalizeExternalAppUrl', () => {
  it('normalizes Google Docs links to preview embeds', () => {
    expect(
      normalizeExternalAppUrl('https://docs.google.com/document/d/abcDEF_123/edit?usp=sharing'),
    ).toEqual({
      provider: 'GOOGLE_DOCS',
      sourceUrl: 'https://docs.google.com/document/d/abcDEF_123/edit',
      embedUrl: 'https://docs.google.com/document/d/abcDEF_123/preview',
    });
  });

  it('normalizes Google Sheets links to preview embeds', () => {
    expect(
      normalizeExternalAppUrl('https://docs.google.com/spreadsheets/d/sheet-123/edit#gid=0'),
    ).toEqual({
      provider: 'GOOGLE_SHEETS',
      sourceUrl: 'https://docs.google.com/spreadsheets/d/sheet-123/edit',
      embedUrl: 'https://docs.google.com/spreadsheets/d/sheet-123/preview',
    });
  });

  it('wraps Figma resources in the official embed endpoint', () => {
    const sourceUrl = 'https://www.figma.com/design/abc123/My-file';

    expect(normalizeExternalAppUrl(sourceUrl)).toEqual({
      provider: 'FIGMA',
      sourceUrl,
      embedUrl: `https://www.figma.com/embed?embed_host=share&url=${encodeURIComponent(sourceUrl)}`,
    });
  });

  it('normalizes Miro board links to live embeds', () => {
    expect(normalizeExternalAppUrl('https://miro.com/app/board/uXjVExample=/')).toEqual({
      provider: 'MIRO',
      sourceUrl: 'https://miro.com/app/board/uXjVExample=/',
      embedUrl: 'https://miro.com/app/live-embed/uXjVExample=/',
    });
  });

  it('accepts only Airtable shared embed links', () => {
    expect(normalizeExternalAppUrl('https://airtable.com/embed/shrExample123')).toEqual({
      provider: 'AIRTABLE',
      sourceUrl: 'https://airtable.com/embed/shrExample123',
      embedUrl: 'https://airtable.com/embed/shrExample123',
    });
  });

  it.each([
    'http://docs.google.com/document/d/abc/edit',
    'javascript:alert(1)',
    'https://docs.google.com.evil.test/document/d/abc/edit',
    'https://user:pass@docs.google.com/document/d/abc/edit',
    'https://docs.google.com:444/document/d/abc/edit',
    'https://airtable.com/appPrivateTable',
    'https://miro.com/app/board/board%2Fevil/',
    'https://miro.com/app/board/../../admin/',
  ])('rejects unsafe or unsupported URL %s', (url) => {
    expect(() => normalizeExternalAppUrl(url)).toThrow();
  });
});
