import '@/features/auth/normalize-auth-callback';
import ErrorBoundary from '@/components/utils/error-boundary';
import { startAuthLifecycle, stopAuthLifecycle } from '@/features/auth/auth-lifecycle';
import { startPwaLifecycle, stopPwaLifecycle } from '@/features/pwa/pwa-lifecycle';
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
startPwaLifecycle();

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
    stopPwaLifecycle();
    stopAuthLifecycle();
    root.unmount();
  });
}
