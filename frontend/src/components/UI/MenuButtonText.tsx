import type { ReactNode } from 'react';

type MenuButtonTextProps = Readonly<{
  children: ReactNode;
  className?: string;
}>;

export function MenuButtonText({ children, className = '' }: MenuButtonTextProps) {
  return <p className={`mx-auto w-40 text-left ${className}`}>{children}</p>;
}
