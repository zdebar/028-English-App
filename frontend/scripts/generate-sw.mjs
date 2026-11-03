import { injectManifest } from 'workbox-build';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const frontendRoot = fileURLToPath(new URL('..', import.meta.url));
const distDir = resolve(frontendRoot, 'dist');
const swSrc = resolve(frontendRoot, 'public/service-worker.js');
const swDest = resolve(distDir, 'service-worker.js');
const BUILD_HASH_PLACEHOLDER = '__APP_BUILD_HASH__';

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
  const placeholderCount = worker.split(BUILD_HASH_PLACEHOLDER).length - 1;
  if (placeholderCount !== 1) {
    throw new Error(`Expected one ${BUILD_HASH_PLACEHOLDER} placeholder, found ${placeholderCount}.`);
  }
  const hash = createHash('sha256').update(worker).digest('hex');
  await writeFile(swDest, worker.replace(BUILD_HASH_PLACEHOLDER, hash));

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
