import type { JSX, ReactNode } from 'react';

/** Shared vertical spacing for overview lists. */
export default function StackedList({ children }: Readonly<{ children: ReactNode }>): JSX.Element {
  return <div className="flex flex-col gap-1 pt-1">{children}</div>;
}
