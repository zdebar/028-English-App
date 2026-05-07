import ErrorBoundary from '@/components/utils/error-boundary.tsx';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    if (import.meta.env.PROD) {
      navigator.serviceWorker.register('/service-worker.js');
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data?.type === 'refresh') {
          globalThis.location.reload();
        }
      });
      return;
    }

    // Prevent dev HMR websocket issues caused by stale SW control.
    navigator.serviceWorker
      .getRegistrations()
      .then((registrations) =>
        Promise.all(registrations.map((registration) => registration.unregister())),
      )
      .then(async () => {
        if ('caches' in globalThis) {
          const cacheKeys = await caches.keys();
          await Promise.all(cacheKeys.map((cacheKey) => caches.delete(cacheKey)));
        }
      })
      .catch(() => {
        // Swallow cleanup errors in development.
      });
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>,
);
