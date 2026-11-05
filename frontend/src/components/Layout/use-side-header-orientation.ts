import { useLayoutEffect, useState } from 'react';

export type SideHeaderOrientation = 'horizontal' | 'vertical';

// --- Orientation threshold ---

export function resolveSideHeaderOrientation(
  viewportWidth: number,
  maxCardWidth: number,
  sideHeaderWidth: number,
): SideHeaderOrientation {
  const horizontalLayoutWidth = maxCardWidth + 2 * sideHeaderWidth;
  return viewportWidth < horizontalLayoutWidth ? 'vertical' : 'horizontal';
}

// --- Hook lifecycle ---

export function useSideHeaderOrientation(viewportWidth: number): SideHeaderOrientation {
  const [orientation, setOrientation] = useState<SideHeaderOrientation>('horizontal');

  useLayoutEffect(() => {
    const updateOrientation = () => setOrientation(measureOrientation(viewportWidth));
    const resizeObserver =
      typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(updateOrientation);

    updateOrientation();
    const initialFrame = window.requestAnimationFrame(updateOrientation);
    document.querySelectorAll<HTMLElement>('[data-header-side]').forEach((headerSide) => {
      resizeObserver?.observe(headerSide);
    });

    return () => {
      window.cancelAnimationFrame(initialFrame);
      resizeObserver?.disconnect();
    };
  }, [viewportWidth]);

  return orientation;
}

// --- DOM measurements ---

function measureOrientation(viewportWidth: number): SideHeaderOrientation {
  const headerSides = document.querySelectorAll<HTMLElement>('[data-header-side]');
  const measuredWidths = Array.from(headerSides, measureHeaderSideHorizontalWidth);
  const sideHeaderWidth = Math.max(0, ...measuredWidths);
  const maxCardWidth = measureCssWidth('--max-width-card');
  return resolveSideHeaderOrientation(viewportWidth, maxCardWidth, sideHeaderWidth);
}

function measureHeaderSideHorizontalWidth(headerSide: HTMLElement): number {
  const children = Array.from(headerSide.children);
  const childrenWidth = children.reduce(
    (total, child) => total + child.getBoundingClientRect().width,
    0,
  );
  const styles = getComputedStyle(headerSide);
  const gap = parsePixelLength(styles.columnGap);
  const horizontalPadding =
    parsePixelLength(styles.paddingLeft) + parsePixelLength(styles.paddingRight);
  const gapCount = Math.max(0, children.length - 1);

  return childrenWidth + gap * gapCount + horizontalPadding;
}

function parsePixelLength(value: string): number {
  const parsedValue = Number.parseFloat(value);
  return Number.isFinite(parsedValue) ? parsedValue : 0;
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
