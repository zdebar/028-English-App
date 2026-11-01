import { useLayoutEffect } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

type InAppRoute = Readonly<{
  key: string;
  path: string;
}>;

type NavigationType = ReturnType<typeof useNavigationType>;

let routes: InAppRoute[] = [];
let currentIndex = -1;

export function useInAppRouteHistory(): void {
  const location = useLocation();
  const navigationType = useNavigationType();

  useLayoutEffect(() => {
    recordInAppRoute(
      {
        key: location.key,
        path: `${location.pathname}${location.search}${location.hash}`,
      },
      navigationType,
    );
  }, [location, navigationType]);
}

export function getPreviousInAppRoute(currentKey: string): InAppRoute | null {
  if (currentIndex <= 0 || routes[currentIndex]?.key !== currentKey) return null;
  return routes[currentIndex - 1] ?? null;
}

function recordInAppRoute(route: InAppRoute, navigationType: NavigationType): void {
  if (currentIndex < 0) {
    routes = [route];
    currentIndex = 0;
    return;
  }

  if (navigationType === 'POP') {
    const existingIndex = routes.findIndex((entry) => entry.key === route.key);
    if (existingIndex < 0) {
      routes = [route];
      currentIndex = 0;
      return;
    }
    routes[existingIndex] = route;
    currentIndex = existingIndex;
    return;
  }

  if (navigationType === 'REPLACE') {
    routes[currentIndex] = route;
    return;
  }

  routes = routes.slice(0, currentIndex + 1);
  if (routes[currentIndex]?.key === route.key) {
    routes[currentIndex] = route;
    return;
  }
  routes.push(route);
  currentIndex = routes.length - 1;
}
