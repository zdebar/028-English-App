import PracticeCard from '@/features/practice/PracticeCard';
import type { JSX } from 'react';
import { useLoaderData } from 'react-router-dom';
import type { PracticeDeckItem } from '@/types/user-item.types';

/**
 * Practice page component.
 * @returns The rendered Practice page component.
 */
export default function Practice(): JSX.Element {
  const deck = useLoaderData() as PracticeDeckItem[];
  return <PracticeCard initialDeck={deck} />;
}
