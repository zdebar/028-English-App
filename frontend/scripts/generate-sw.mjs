import { injectManifest } from 'workbox-build';
import { resolve } from 'node:path';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const distDir = resolve(process.cwd(), 'dist');
const swSrc = resolve(process.cwd(), 'public/service-worker.js');
const swDest = resolve(distDir, 'service-worker.js');

async function buildServiceWorker() {
  const { count, size, warnings } = await injectManifest({
    swSrc,
    swDest,
    injectionPoint: 'globalThis.__WB_MANIFEST',
    globDirectory: distDir,
    globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,woff2,woff,ttf,json}'],
    globIgnores: ['service-worker.js'],
  });

  const worker = await readFile(swDest, 'utf8');
  const hash = createHash('sha256').update(worker).digest('hex');
  await writeFile(swDest, worker.replace('__APP_BUILD_HASH__', hash));

  if (warnings.length > 0) {
    warnings.forEach((warning) => console.warn(warning));
  }

  console.log(`Injected ${count} files (${size} bytes) into service-worker.js`);
}

try {
  await buildServiceWorker();
} catch (error) {
  console.error('Failed to inject service worker manifest:', error);
  process.exitCode = 1;
}
