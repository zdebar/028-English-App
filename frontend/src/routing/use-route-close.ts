import { useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

/** Returns to the previous in-app location, or uses a safe fallback for a direct entry. */
export function useRouteClose(fallbackTo: string): () => void {
  const location = useLocation();
  const navigate = useNavigate();

  return useCallback(() => {
    if (location.key !== 'default') {
      navigate(-1);
      return;
    }

    navigate(fallbackTo, { replace: true });
  }, [fallbackTo, location.key, navigate]);
}
