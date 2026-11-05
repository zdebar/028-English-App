import { useLayoutEffect, useState } from 'react';
import type { ViewportSize } from './use-viewport-size';

type ResponsiveLayout = Readonly<{
  headerLayout: 'side' | 'top';
  secondaryLayout: 'bottom' | 'side';
}>;

type LayoutMeasurements = Readonly<{
  viewportWidth: number;
  viewportHeight: number;
  maxCardHeight: number;
  headerHeight: number;
  secondaryControlsHeight: number;
}>;

const DEFAULT_LAYOUT: ResponsiveLayout = {
  headerLayout: 'top',
  secondaryLayout: 'bottom',
};

// --- Layout thresholds ---

export function resolveResponsiveLayout({
  viewportWidth,
  viewportHeight,
  maxCardHeight,
  headerHeight,
  secondaryControlsHeight,
}: LayoutMeasurements): ResponsiveLayout {
  const isLandscape = viewportWidth > viewportHeight;
  if (!isLandscape) return DEFAULT_LAYOUT;

  const fullPracticeLayoutHeight = maxCardHeight + secondaryControlsHeight + headerHeight;
  const headerLayout = viewportHeight < fullPracticeLayoutHeight ? 'side' : 'top';
  const secondaryLayout = viewportHeight <= maxCardHeight ? 'side' : 'bottom';

  return { headerLayout, secondaryLayout };
}

// --- Hook lifecycle ---

export function useResponsiveLayout(viewportSize: ViewportSize): ResponsiveLayout {
  const [layout, setLayout] = useState<ResponsiveLayout>(DEFAULT_LAYOUT);

  useLayoutEffect(() => {
    const nextLayout = measureResponsiveLayout(viewportSize);
    setLayout((currentLayout) => {
      const layoutUnchanged =
        currentLayout.headerLayout === nextLayout.headerLayout &&
        currentLayout.secondaryLayout === nextLayout.secondaryLayout;
      return layoutUnchanged ? currentLayout : nextLayout;
    });
  }, [viewportSize.height, viewportSize.width]);

  return layout;
}

// --- CSS token measurements ---

function readCssLength(probe: HTMLDivElement, variableName: string): number {
  probe.style.height = `var(${variableName})`;
  return probe.getBoundingClientRect().height;
}

function measureResponsiveLayout(viewportSize: ViewportSize): ResponsiveLayout {
  const probe = document.createElement('div');
  probe.style.position = 'fixed';
  probe.style.visibility = 'hidden';
  probe.style.pointerEvents = 'none';
  document.documentElement.appendChild(probe);

  const maxCardHeight = readCssLength(probe, '--max-height-card');
  const headerHeight = readCssLength(probe, '--height-header');
  const secondaryControlsHeight = readCssLength(probe, '--height-button');
  probe.remove();

  return resolveResponsiveLayout({
    viewportWidth: viewportSize.width,
    viewportHeight: viewportSize.height,
    maxCardHeight,
    headerHeight,
    secondaryControlsHeight,
  });
}
