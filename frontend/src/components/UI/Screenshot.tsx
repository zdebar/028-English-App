import type { JSX } from 'react';

interface ScreenshotProps {
  src: string;
  alt: string;
}

/**
 * Renders a screenshot image with a caption.
 *
 * @param {string} src - The source URL of the screenshot image
 * @param {string} alt - The alt text for the image, also used as the figure caption
 * @returns {JSX.Element} A figure element containing the image and caption
 */
export function Screenshot({ src, alt }: ScreenshotProps): JSX.Element {
  return (
    <figure className="mx-auto my-4 max-w-[280px]">
      <img
        src={src}
        alt={alt}
        className="h-auto w-full rounded shadow-2xl"
        width={280}
        height={525}
        loading="lazy"
      />
      <figcaption className="mt-2 text-center text-sm text-gray-500">{alt}</figcaption>
    </figure>
  );
}
