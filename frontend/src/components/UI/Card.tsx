import type { JSX, ReactNode } from 'react';

type CardProps = Readonly<{
  children: ReactNode;
  className?: string;
}>;
/**
 * Generic card container used as a visual wrapper for content blocks.
 *
 * Primarily provides consistent width and spacing used across various
 * overview/detail UI components.
 */
export default function Card({ children, className = '' }: CardProps): JSX.Element {
  return (
    <div className={`card-width relative flex flex-col justify-start gap-1 ${className}`}>
      {children}
    </div>
  );
}
