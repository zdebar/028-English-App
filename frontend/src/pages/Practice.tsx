import PracticeCard from '@/features/practice/PracticeCard';
import type { ReviewPracticeMode } from '@/types/user-item.types';
import type { JSX } from 'react';

type PracticeProps = Readonly<{
  mode?: ReviewPracticeMode;
}>;

/**
 * Practice page component.
 * @returns The rendered Practice page component.
 */
export default function Practice({ mode = 'vocabulary' }: PracticeProps): JSX.Element {
  return <PracticeCard mode={mode} />;
}
