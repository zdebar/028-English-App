import type { JSX, ReactNode } from 'react';

type CardProps = Readonly<{
  children: ReactNode;
  className?: string;
}>;

export default function Card({ children, className = '' }: CardProps): JSX.Element {
  return (
    <div className={`card-width relative flex flex-col justify-start gap-1 ${className}`}>
      {children}
    </div>
  );
}
