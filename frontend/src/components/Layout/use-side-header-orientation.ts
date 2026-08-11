import { useLayoutEffect, useState } from 'react';

export type SideHeaderOrientation = 'horizontal' | 'vertical';

export function resolveSideHeaderOrientation(
  viewportWidth: number,
  maxCardWidth: number,
  sideHeaderWidth: number,
): SideHeaderOrientation {
  const horizontalLayoutWidth = maxCardWidth + sideHeaderWidth + sideHeaderWidth;
  if (viewportWidth < horizontalLayoutWidth) return 'vertical';
  return 'horizontal';
}

function measureCssWidth(variableName: string): number {
  const probe = document.createElement('div');
  probe.style.position = 'fixed';
  probe.style.visibility = 'hidden';
  probe.style.pointerEvents = 'none';
  probe.style.width = `var(${variableName})`;
  document.documentElement.appendChild(probe);
  const width = probe.getBoundingClientRect().width;
  probe.remove();
  return width;
}

function measureHeaderContentWidth(headerSide: HTMLElement): number {
  const children = Array.from(headerSide.children);
  const childrenWidth = children.reduce(
    (total, child) => total + child.getBoundingClientRect().width,
    0,
  );
  const parsedGap = Number.parseFloat(getComputedStyle(headerSide).columnGap);
  let gap = parsedGap;
  if (Number.isNaN(parsedGap)) gap = 0;
  const gapCount = Math.max(0, children.length - 1);
  return childrenWidth + gap * gapCount;
}

function measureOrientation(): SideHeaderOrientation {
  const headerSides = document.querySelectorAll<HTMLElement>('[data-header-side]');
  const measuredWidths = Array.from(headerSides, measureHeaderContentWidth);
  const sideHeaderWidth = Math.max(0, ...measuredWidths);
  const maxCardWidth = measureCssWidth('--max-width-card');
  return resolveSideHeaderOrientation(window.innerWidth, maxCardWidth, sideHeaderWidth);
}

export function useSideHeaderOrientation(): SideHeaderOrientation {
  const [orientation, setOrientation] = useState<SideHeaderOrientation>('horizontal');

  useLayoutEffect(() => {
    const updateOrientation = () => {
      const nextOrientation = measureOrientation();
      setOrientation((currentOrientation) => {
        if (currentOrientation === nextOrientation) return currentOrientation;
        return nextOrientation;
      });
    };

    updateOrientation();
    const initialFrame = window.requestAnimationFrame(updateOrientation);
    window.addEventListener('resize', updateOrientation);

    let resizeObserver: ResizeObserver | undefined;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(updateOrientation);
      document.querySelectorAll<HTMLElement>('[data-header-side]').forEach((headerSide) => {
        resizeObserver?.observe(headerSide);
      });
    }

    return () => {
      window.cancelAnimationFrame(initialFrame);
      window.removeEventListener('resize', updateOrientation);
      resizeObserver?.disconnect();
    };
  }, []);

  return orientation;
}
