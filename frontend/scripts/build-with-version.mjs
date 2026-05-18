import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    shell: false,
    ...options,
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(' ')} exited with code ${result.status}`);
  }
}

function getSafeSystemPath() {
  if (process.platform === 'win32') {
    return [
      String.raw`C:\Windows\System32`,
      String.raw`C:\Windows`,
      String.raw`C:\Program Files\Git\bin`,
      String.raw`C:\Program Files\Git\cmd`,
    ].join(';');
  }
  return ['/usr/local/bin', '/usr/bin', '/bin'].join(':');
}

function getGitSha() {
  const result = spawnSync('git', ['rev-parse', '--short', 'HEAD'], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
    shell: false,
    env: { PATH: getSafeSystemPath() },
  });

  if (result.status !== 0) {
    return null;
  }

  const sha = result.stdout.trim();
  return sha.length > 0 ? sha : null;
}

function getPackageInfo() {
  const packagePath = resolve(process.cwd(), 'package.json');
  const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
  return {
    name: packageJson.name ?? 'app',
    version: packageJson.version ?? '0.0.0',
  };
}

function resolveLocalCli(relativePath) {
  return resolve(process.cwd(), relativePath);
}

function resolveAppVersion() {
  const explicitVersion = process.env.VITE_APP_VERSION?.trim();
  if (explicitVersion) {
    return explicitVersion;
  }

  const { name, version } = getPackageInfo();
  const gitSha = getGitSha() ?? 'local';
  return `${name}@${version}+${gitSha}`;
}

try {
  const appVersion = resolveAppVersion();
  const buildEnv = {
    ...process.env,
    VITE_APP_VERSION: appVersion,
  };

  console.log(`Building with VITE_APP_VERSION=${appVersion}`);

  const tscCli = resolveLocalCli('node_modules/typescript/bin/tsc');
  const viteCli = resolveLocalCli('node_modules/vite/bin/vite.js');

  run(process.execPath, [tscCli, '-b']);
  run(process.execPath, [viteCli, 'build'], { env: buildEnv });
  run(process.execPath, ['scripts/generate-sw.mjs'], { env: buildEnv });
} catch (error) {
  console.error('Build failed:', error);
  process.exitCode = 1;
}
