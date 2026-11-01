import { useLayoutEffect } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

type NavigationType = ReturnType<typeof useNavigationType>;

let routeKeys: string[] = [];
let currentIndex = -1;

export function useInAppRouteHistory(): void {
  const location = useLocation();
  const navigationType = useNavigationType();

  useLayoutEffect(() => {
    recordInAppRoute(location.key, navigationType);
  }, [location, navigationType]);
}

export function hasPreviousInAppRoute(currentKey: string): boolean {
  return currentIndex > 0 && routeKeys[currentIndex] === currentKey;
}

function recordInAppRoute(routeKey: string, navigationType: NavigationType): void {
  if (currentIndex < 0) {
    routeKeys = [routeKey];
    currentIndex = 0;
    return;
  }

  if (navigationType === 'POP') {
    const existingIndex = routeKeys.indexOf(routeKey);
    if (existingIndex < 0) {
      routeKeys = [routeKey];
      currentIndex = 0;
      return;
    }
    currentIndex = existingIndex;
    return;
  }

  if (navigationType === 'REPLACE') {
    routeKeys[currentIndex] = routeKey;
    return;
  }

  routeKeys = routeKeys.slice(0, currentIndex + 1);
  if (routeKeys[currentIndex] === routeKey) {
    return;
  }
  routeKeys.push(routeKey);
  currentIndex = routeKeys.length - 1;
}
