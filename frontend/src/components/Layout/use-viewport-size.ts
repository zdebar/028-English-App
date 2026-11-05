import { useLayoutEffect, useState } from 'react';

export type ViewportSize = Readonly<{
  width: number;
  height: number;
}>;

/** Reads and shares the current browser viewport dimensions. */
export function useViewportSize(): ViewportSize {
  const [viewportSize, setViewportSize] = useState<ViewportSize>(readViewportSize);

  useLayoutEffect(() => {
    const updateViewportSize = () => {
      const nextViewportSize = readViewportSize();
      setViewportSize((currentViewportSize) => {
        const sizeUnchanged =
          currentViewportSize.width === nextViewportSize.width &&
          currentViewportSize.height === nextViewportSize.height;
        return sizeUnchanged ? currentViewportSize : nextViewportSize;
      });
    };

    window.addEventListener('resize', updateViewportSize);
    updateViewportSize();
    return () => window.removeEventListener('resize', updateViewportSize);
  }, []);

  return viewportSize;
}

function readViewportSize(): ViewportSize {
  return {
    width: window.innerWidth,
    height: window.innerHeight,
  };
}
