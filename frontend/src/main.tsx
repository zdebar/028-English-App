import '@/features/auth/normalize-auth-callback';
import ErrorBoundary from '@/components/utils/error-boundary';
import { startAuthLifecycle, stopAuthLifecycle } from '@/features/auth/auth-lifecycle';
import { usePwaStore } from '@/features/pwa/use-pwa-store';
import { router } from '@/router';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';

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

requestPersistentStorage();
void startAuthLifecycle();

const handleBeforeInstallPrompt = (event: Event) => {
  event.preventDefault();
  usePwaStore.getState().setPromptEvent(event as any);
};

globalThis.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

if ('serviceWorker' in navigator) {
  const scope = new URL(import.meta.env.BASE_URL, globalThis.location.origin).href;
  const cachePrefix = `english-app:${encodeURIComponent(scope)}:`;
  globalThis.addEventListener('load', () => {
    if (import.meta.env.PROD) {
      void navigator.serviceWorker
        .register(`${scope}service-worker.js`, { scope })
        .catch((error) => {
          console.warn('Service worker registration failed:', error);
        });
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.source === navigator.serviceWorker.controller && event.data?.type === 'refresh') {
          globalThis.location.reload();
        }
      });
      return;
    }

    // Prevent dev HMR websocket issues caused by stale SW control.
    navigator.serviceWorker
      .getRegistrations()
      .then((registrations) =>
        Promise.all(
          registrations
            .filter((registration) => registration.scope === scope)
            .map((registration) => registration.unregister()),
        ),
      )
      .then(async () => {
        if ('caches' in globalThis) {
          const cacheKeys = await caches.keys();
          await Promise.all(
            cacheKeys
              .filter((key) => key.startsWith(cachePrefix))
              .map((cacheKey) => caches.delete(cacheKey)),
          );
        }
      })
      .catch(() => {
        // Swallow cleanup errors in development.
      });
  });
}

const root = createRoot(document.getElementById('root')!);
root.render(
  <StrictMode>
    <ErrorBoundary>
      <RouterProvider router={router} />
    </ErrorBoundary>
  </StrictMode>,
);

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    globalThis.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    stopAuthLifecycle();
    root.unmount();
  });
}
