export type ExternalAppProvider = 'GOOGLE_DOCS' | 'GOOGLE_SHEETS' | 'FIGMA' | 'MIRO' | 'AIRTABLE';

export interface NormalizedExternalAppUrl {
  provider: ExternalAppProvider;
  sourceUrl: string;
  embedUrl: string;
}

const GOOGLE_RESOURCE_PATTERN = /^\/(document|spreadsheets)\/d\/([A-Za-z0-9_-]+)(?:\/[^/?#]*)?\/?$/;
const FIGMA_RESOURCE_PATTERN = /^\/(design|file|proto)\/([A-Za-z0-9_-]+)(?:\/[^?#]*)?$/;
const MIRO_BOARD_PATTERN = /^\/app\/board\/([A-Za-z0-9_=-]+)\/?$/;
const AIRTABLE_EMBED_PATTERN = /^\/embed\/(shr[A-Za-z0-9]+)\/?$/;

export function normalizeExternalAppUrl(rawUrl: string): NormalizedExternalAppUrl {
  let url: URL;

  try {
    url = new URL(rawUrl.trim());
  } catch {
    throw new Error('Некорректная ссылка');
  }

  if (
    url.protocol !== 'https:' ||
    url.username ||
    url.password ||
    url.port ||
    url.hostname.endsWith('.local')
  ) {
    throw new Error('Разрешены только публичные HTTPS-ссылки без логина, пароля и порта');
  }

  const hostname = url.hostname.toLowerCase();

  if (hostname === 'docs.google.com') {
    return normalizeGoogleUrl(url);
  }

  if (hostname === 'figma.com' || hostname === 'www.figma.com') {
    return normalizeFigmaUrl(url);
  }

  if (hostname === 'miro.com' || hostname === 'www.miro.com') {
    return normalizeMiroUrl(url);
  }

  if (hostname === 'airtable.com' || hostname === 'www.airtable.com') {
    return normalizeAirtableUrl(url);
  }

  throw new Error('Поддерживаются Google Docs, Google Sheets, Figma, Miro и Airtable');
}

function normalizeGoogleUrl(url: URL): NormalizedExternalAppUrl {
  const match = url.pathname.match(GOOGLE_RESOURCE_PATTERN);

  if (!match) {
    throw new Error('Ссылка Google должна вести на документ или таблицу');
  }

  const [, resourceType, resourceId] = match;
  const sourceUrl = `https://docs.google.com/${resourceType}/d/${resourceId}/edit`;
  const provider = resourceType === 'document' ? 'GOOGLE_DOCS' : 'GOOGLE_SHEETS';

  return {
    provider,
    sourceUrl,
    embedUrl: `https://docs.google.com/${resourceType}/d/${resourceId}/preview`,
  };
}

function normalizeFigmaUrl(url: URL): NormalizedExternalAppUrl {
  if (!FIGMA_RESOURCE_PATTERN.test(url.pathname)) {
    throw new Error('Ссылка Figma должна вести на файл, дизайн или прототип');
  }

  const sourceUrl = `https://www.figma.com${url.pathname.replace(/\/$/, '')}`;

  return {
    provider: 'FIGMA',
    sourceUrl,
    embedUrl: `https://www.figma.com/embed?embed_host=share&url=${encodeURIComponent(sourceUrl)}`,
  };
}

function normalizeMiroUrl(url: URL): NormalizedExternalAppUrl {
  const match = url.pathname.match(MIRO_BOARD_PATTERN);

  if (!match) {
    throw new Error('Ссылка Miro должна вести на доску');
  }

  const boardId = match[1];

  return {
    provider: 'MIRO',
    sourceUrl: `https://miro.com/app/board/${boardId}/`,
    embedUrl: `https://miro.com/app/live-embed/${boardId}/`,
  };
}

function normalizeAirtableUrl(url: URL): NormalizedExternalAppUrl {
  const match = url.pathname.match(AIRTABLE_EMBED_PATTERN);

  if (!match) {
    throw new Error('Для Airtable используйте публичную embed-ссылку вида /embed/shr…');
  }

  const sourceUrl = `https://airtable.com/embed/${match[1]}`;

  return {
    provider: 'AIRTABLE',
    sourceUrl,
    embedUrl: sourceUrl,
  };
}
