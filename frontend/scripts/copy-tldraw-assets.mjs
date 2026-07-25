import { cpSync, mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const assetsRoot = dirname(require.resolve('@tldraw/assets/package.json'));
const destRoot = join(dirname(fileURLToPath(import.meta.url)), '../public/tldraw');

mkdirSync(destRoot, { recursive: true });

for (const dir of ['embed-icons', 'fonts', 'icons', 'translations']) {
  cpSync(join(assetsRoot, dir), join(destRoot, dir), { recursive: true });
}

console.log(`Copied tldraw assets → ${destRoot}`);
