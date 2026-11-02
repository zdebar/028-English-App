import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const frontendRoot = fileURLToPath(new URL('..', import.meta.url));

function run(script, args = []) {
  const scriptPath = resolve(frontendRoot, script);
  const result = spawnSync(process.execPath, [scriptPath, ...args], {
    cwd: frontendRoot,
    stdio: 'inherit',
    shell: false,
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    throw new Error(`${script} exited with code ${result.status}`);
  }
}

try {
  run('node_modules/typescript/bin/tsc', ['-b']);
  run('node_modules/vite/bin/vite.js', ['build']);
  run('scripts/generate-sw.mjs');
} catch (error) {
  console.error('Build failed:', error);
  process.exitCode = 1;
}
