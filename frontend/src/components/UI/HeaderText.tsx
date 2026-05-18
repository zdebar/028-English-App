import type { JSX, ReactNode } from 'react';

type HeaderTextProps = Readonly<{
  children: ReactNode;
  className?: string;
}>;

export default function HeaderText({ children, className = '' }: HeaderTextProps): JSX.Element {
  return <div className={`flex grow justify-start px-4 ${className}`}>{children}</div>;
}
