import { usePwaStore } from './use-pwa-store';
import type { BeforeInstallPromptEvent } from './pwa.types';

let cleanup: (() => void) | null = null;

/** Starts the PWA event listeners and service worker lifecycle. */
export function startPwaLifecycle(): void {
  if (cleanup !== null) return;

  requestPersistentStorage();

  const handleBeforeInstallPrompt = (event: Event): void => {
    event.preventDefault();
    usePwaStore.getState().setPromptEvent(event as BeforeInstallPromptEvent);
  };

  const handleAppInstalled = (): void => {
    usePwaStore.getState().clearPromptEvent();
  };

  globalThis.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  globalThis.addEventListener('appinstalled', handleAppInstalled);

  if ('serviceWorker' in navigator) {
    const serviceWorker = navigator.serviceWorker;
    const scope = new URL(import.meta.env.BASE_URL, globalThis.location.origin).href;
    const cachePrefix = `english-app:${encodeURIComponent(scope)}:`;

    const handleServiceWorkerMessage = (event: MessageEvent): void => {
      if (event.source === serviceWorker.controller && event.data?.type === 'refresh') {
        globalThis.location.reload();
      }
    };

    const handleWindowLoad = (): void => {
      if (import.meta.env.PROD) {
        void serviceWorker.register(`${scope}service-worker.js`, { scope }).catch((error) => {
          console.warn('Service worker registration failed:', error);
        });
        serviceWorker.addEventListener('message', handleServiceWorkerMessage);
        return;
      }

      // Prevent dev HMR websocket issues caused by stale SW control.
      void unregisterDevelopmentServiceWorkers(scope, cachePrefix).catch(() => {
        // Ignore cleanup failures in development.
      });
    };

    if (document.readyState === 'complete') {
      handleWindowLoad();
    } else {
      globalThis.addEventListener('load', handleWindowLoad, { once: true });
    }

    cleanup = () => {
      globalThis.removeEventListener('load', handleWindowLoad);
      serviceWorker.removeEventListener('message', handleServiceWorkerMessage);
      globalThis.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      globalThis.removeEventListener('appinstalled', handleAppInstalled);
      cleanup = null;
    };
    return;
  }

  cleanup = () => {
    globalThis.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    globalThis.removeEventListener('appinstalled', handleAppInstalled);
    cleanup = null;
  };
}

function requestPersistentStorage(): void {
  const storage = globalThis.navigator?.storage;
  if (typeof storage?.persist !== 'function' || typeof storage.persisted !== 'function') return;

  storage.persisted()
    .then((alreadyPersistent) => alreadyPersistent || storage.persist())
    .then((isPersistent) => {
      if (!isPersistent) console.info('Browser did not grant persistent storage.');
    })
    .catch((error: unknown) => {
      console.warn('Persistent storage request failed:', error);
    });
}

/** Removes only this app's service workers and caches while running the dev server. */
async function unregisterDevelopmentServiceWorkers(scope: string, cachePrefix: string): Promise<void> {
  const registrations = await navigator.serviceWorker.getRegistrations();
  await Promise.all(
    registrations
      .filter((registration) => registration.scope === scope)
      .map((registration) => registration.unregister()),
  );

  if (!('caches' in globalThis)) return;

  const cacheKeys = await caches.keys();
  await Promise.all(
    cacheKeys
      .filter((key) => key.startsWith(cachePrefix))
      .map((cacheKey) => caches.delete(cacheKey)),
  );
}

/** Stops PWA listeners so HMR can safely reinitialize them. */
export function stopPwaLifecycle(): void {
  cleanup?.();
}
