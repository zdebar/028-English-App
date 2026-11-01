import '@/features/auth/normalize-auth-callback';
import ErrorBoundary from '@/components/utils/error-boundary';
import { startAuthLifecycle, stopAuthLifecycle } from '@/features/auth/auth-lifecycle';
import { startPwaLifecycle, stopPwaLifecycle } from '@/features/pwa/pwa-lifecycle';
import { router } from '@/router';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';

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

// Hot Module Replacement (HMR) - Cleanup on module replacement
if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    stopPwaLifecycle();
    stopAuthLifecycle();
    root.unmount();
  });
}
