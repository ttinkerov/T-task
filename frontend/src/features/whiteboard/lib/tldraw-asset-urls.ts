import { getAssetUrls } from '@tldraw/assets/selfHosted';

/** Self-hosted tldraw static assets under /public/tldraw (see scripts/copy-tldraw-assets.mjs). */
export const tldrawAssetUrls = getAssetUrls({ baseUrl: '/tldraw' });
