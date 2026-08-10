import { useLayoutEffect, useState } from 'react';

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

function readCssLength(probe: HTMLDivElement, variableName: string): number {
  probe.style.height = `var(${variableName})`;
  return probe.getBoundingClientRect().height;
}

function measureResponsiveLayout(): ResponsiveLayout {
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
    viewportWidth: window.innerWidth,
    viewportHeight: window.innerHeight,
    maxCardHeight,
    headerHeight,
    secondaryControlsHeight,
  });
}

export function useResponsiveLayout(): ResponsiveLayout {
  const [layout, setLayout] = useState<ResponsiveLayout>(DEFAULT_LAYOUT);

  useLayoutEffect(() => {
    const updateLayout = () => {
      const nextLayout = measureResponsiveLayout();
      setLayout((currentLayout) => {
        const headerUnchanged = currentLayout.headerLayout === nextLayout.headerLayout;
        const secondaryUnchanged =
          currentLayout.secondaryLayout === nextLayout.secondaryLayout;
        if (headerUnchanged && secondaryUnchanged) return currentLayout;
        return nextLayout;
      });
    };

    updateLayout();
    window.addEventListener('resize', updateLayout);
    return () => window.removeEventListener('resize', updateLayout);
  }, []);

  return layout;
}
