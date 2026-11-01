import type { ReactNode } from 'react';

type MenuButtonTextProps = Readonly<{
  children: ReactNode;
  className?: string;
}>;

export function MenuButtonText({ children, className = '' }: MenuButtonTextProps) {
  return <span className={`mx-auto block w-40 text-left ${className}`}>{children}</span>;
}
