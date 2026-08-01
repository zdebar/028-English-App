import VocabularyOverview from '@/features/vocabulary/VocabularOverview';
import type { JSX } from 'react';
import { useLoaderData } from 'react-router-dom';
import type { UserItemLocal } from '@/types/user-item.types';

/**
 * Vocabulary page component.
 * @returns The rendered Vocabulary page component.
 */
export default function Vocabulary(): JSX.Element {
  const words = useLoaderData() as UserItemLocal[];
  return <VocabularyOverview initialWords={words} />;
}
