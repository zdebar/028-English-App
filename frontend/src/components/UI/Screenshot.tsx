import { useThemeStore } from '@/features/theme/use-theme-store';
import type { JSX } from 'react';

type ScreenshotProps = Readonly<{
  readonly src: string;
  readonly alt: string;
}>;

/**
 * Renders a screenshot image with a caption.
 *
 * @param {string} src - The source URL of the screenshot image
 * @param {string} alt - The alt text for the image, also used as the figure caption
 */
export function Screenshot({ src, alt }: ScreenshotProps): JSX.Element {
  const isDarkMode = useThemeStore((state) => state.theme === 'dark');

  return (
    <figure className="mx-auto my-4 max-w-[320px]">
      <img
        src={isDarkMode ? `${src}.dark.webp` : `${src}.webp`}
        alt={alt}
        className="h-auto w-full rounded shadow-2xl"
        width={320}
        height={600}
        loading="lazy"
      />
      <figcaption className="mt-2 text-center text-sm">{alt}</figcaption>
    </figure>
  );
}
