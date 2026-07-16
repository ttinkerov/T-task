export type ExternalAppProvider = 'GOOGLE_DOCS' | 'GOOGLE_SHEETS' | 'FIGMA' | 'MIRO' | 'AIRTABLE';

export interface WorkspaceExternalApp {
  id: string;
  provider: ExternalAppProvider;
  title: string;
  sourceUrl: string;
  embedUrl: string;
  createdAt: string;
  createdBy: {
    id: string;
    name: string;
  } | null;
}

export interface CreateExternalAppPayload {
  title: string;
  url: string;
}

export const APP_PROVIDER_META: Record<
  ExternalAppProvider,
  { label: string; icon: string; tone: string }
> = {
  GOOGLE_DOCS: { label: 'Google Docs', icon: 'D', tone: 'blue' },
  GOOGLE_SHEETS: { label: 'Google Sheets', icon: 'S', tone: 'green' },
  FIGMA: { label: 'Figma', icon: 'F', tone: 'violet' },
  MIRO: { label: 'Miro', icon: 'M', tone: 'yellow' },
  AIRTABLE: { label: 'Airtable', icon: 'A', tone: 'red' },
};
