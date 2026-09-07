// @vitest-environment node
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { describe, expect, it, vi } from 'vitest';

const source = readFileSync(new URL('../public/service-worker.js', import.meta.url), 'utf8');
const scope = 'https://example.com/028-English-App/';
const prefix = `english-app:${encodeURIComponent(scope)}:`;

function setup(existing = new Map(), version = 'one') {
  const handlers = {};
  const fetch = vi.fn().mockRejectedValue(new Error('offline'));
  const skipWaiting = vi.fn();
  const ownClient = { url: scope, postMessage: vi.fn() };
  const otherClient = { url: 'https://example.com/other/', postMessage: vi.fn() };
  const caches = {
    keys: async () => [...existing.keys()],
    delete: vi.fn(async (name) => existing.delete(name)),
    open: async (name) => {
      if (!existing.has(name)) existing.set(name, new Map());
      const entries = existing.get(name);
      return {
        addAll: async (urls) => {
          for (const url of urls) entries.set(url, await fetch(url));
        },
        match: async (key) => entries.get(key.url || key)?.clone(),
        put: async (key, response) => entries.set(key.url || key, response),
      };
    },
  };
  runInNewContext(source.replace('__APP_BUILD_HASH__', version), {
    URL,
    Response,
    console,
    caches,
    fetch,
    skipWaiting,
    registration: { scope },
    clients: {
      claim: vi.fn(),
      matchAll: async () => [ownClient, otherClient],
    },
    __WB_MANIFEST: [{ url: 'assets/app.js' }],
    addEventListener: (type, handler) => {
      handlers[type] = handler;
    },
  });
  async function lifecycle(type) {
    let completion;
    handlers[type]({
      waitUntil: (promise) => {
        completion = promise;
      },
    });
    await completion;
  }
  async function request(path, mode = 'navigate', destination = '') {
    let response;
    let completion;
    handlers.fetch({
      request: { url: new URL(path, scope).href, method: 'GET', mode, destination },
      respondWith: (promise) => {
        response = promise;
      },
      waitUntil: (promise) => {
        completion = promise;
      },
    });
    await completion;
    return response;
  }
  return { existing, fetch, skipWaiting, caches, lifecycle, request, ownClient, otherClient };
}

describe('service worker', () => {
  it('retains precached shell and scripts across worker restart', async () => {
    const first = setup();
    first.fetch.mockResolvedValue(
      new Response('cached', { headers: { 'Content-Type': 'text/html' } }),
    );
    await first.lifecycle('install');
    expect(first.skipWaiting).toHaveBeenCalledOnce();
    const restarted = setup(first.existing);
    expect(await (await restarted.request('./')).text()).toBe('cached');
    expect(await (await restarted.request('levels')).text()).toBe('cached');
    expect(await (await restarted.request('assets/app.js', 'cors', 'script')).text()).toBe(
      'cached',
    );
    expect([...first.existing.keys()].every((key) => key.endsWith(':one'))).toBe(true);
  });

  it('rejects failed installation before skipWaiting', async () => {
    const worker = setup();
    await expect(worker.lifecycle('install')).rejects.toThrow('offline');
    expect(worker.skipWaiting).not.toHaveBeenCalled();
  });

  it('removes only obsolete scoped caches and notifies only scoped clients', async () => {
    const existing = new Map([
      [prefix + 'shell:old', new Map()],
      [prefix + 'shell:one', new Map()],
      ['app-shell-legacy', new Map()],
      ['english-app:other:static:old', new Map()],
    ]);
    const worker = setup(existing);
    await worker.lifecycle('activate');
    expect(worker.caches.delete.mock.calls).toEqual([[prefix + 'shell:old']]);
    expect(worker.ownClient.postMessage).toHaveBeenCalledOnce();
    expect(worker.otherClient.postMessage).not.toHaveBeenCalled();
  });

  it('bypasses external resources, other scopes and data/API requests', async () => {
    const worker = setup();
    for (const path of [
      'https://hcaptcha.com/a.js',
      '/other/a.js',
      'api/x',
      'rest/x',
      'rpc/x',
      'data/x',
    ]) {
      expect(await worker.request(path, 'cors', 'script')).toBeUndefined();
    }
    expect(worker.fetch).not.toHaveBeenCalled();
  });

  it('does not replace shell with HTTP errors or non-HTML responses', async () => {
    const worker = setup(
      new Map([[prefix + 'shell:one', new Map([[scope + 'index.html', new Response('shell')]])]]),
    );
    worker.fetch.mockResolvedValueOnce(new Response('error', { status: 404 }));
    expect((await worker.request('missing')).status).toBe(404);
    worker.fetch.mockResolvedValueOnce(
      new Response('{}', { headers: { 'Content-Type': 'application/json' } }),
    );
    await worker.request('json');
    expect(await (await worker.request('levels')).text()).toBe('shell');
  });

  it('completes cache writes and returns 503 when no offline resource exists', async () => {
    const worker = setup();
    expect((await worker.request('./')).status).toBe(503);
    worker.fetch.mockResolvedValueOnce(
      new Response('new shell', { headers: { 'Content-Type': 'text/html' } }),
    );
    await worker.request('./');
    expect(await (await worker.request('levels')).text()).toBe('new shell');
    worker.fetch.mockResolvedValueOnce(new Response('script'));
    await worker.request('assets/new.js', 'cors', 'script');
    expect(await (await worker.request('assets/new.js', 'cors', 'script')).text()).toBe('script');
  });
});
