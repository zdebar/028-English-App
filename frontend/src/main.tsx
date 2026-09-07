import ErrorBoundary from '@/components/utils/error-boundary';
// import { initializeMonitoring } from '@/features/logging/monitoring-handler';
import { startAuthLifecycle, stopAuthLifecycle } from '@/features/auth/auth-lifecycle';
import { router } from '@/router';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';

// initializeMonitoring();
void startAuthLifecycle();

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
    stopAuthLifecycle();
    root.unmount();
  });
}
