import PracticeCard from '@/features/practice/PracticeCard';
import type { ReviewDeckData } from '@/database/state/data-types';
import { useLoaderData } from 'react-router-dom';
import type { JSX } from 'react';

/**
 * Practice page component.
 * @returns The rendered Practice page component.
 */
export default function Practice(): JSX.Element {
  const initialData = useLoaderData() as ReviewDeckData;
  return <PracticeCard initialData={initialData} />;
}
