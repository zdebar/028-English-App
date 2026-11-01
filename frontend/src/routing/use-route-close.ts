import { useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getPreviousInAppRoute } from './in-app-route-history';

/** Returns to a recorded in-app route, then the page fallback, with browser history as a last resort. */
export function useRouteClose(fallbackTo?: string): () => void {
  const location = useLocation();
  const navigate = useNavigate();

  return useCallback(() => {
    const previousRoute = getPreviousInAppRoute(location.key);
    if (previousRoute) {
      void navigate(-1);
      return;
    }

    if (fallbackTo) {
      void navigate(fallbackTo, { replace: true });
      return;
    }

    void navigate(-1);
  }, [fallbackTo, location.key, navigate]);
}
