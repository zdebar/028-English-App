import PracticeCard from '@/features/practice/PracticeCard';
import type { JSX } from 'react';
import { useLoaderData } from 'react-router-dom';
import type { ReviewDeckData } from '@/database/utils/practice-content.utils';

/**
 * Practice page component.
 * @returns The rendered Practice page component.
 */
export default function Practice(): JSX.Element {
  const reviewData = useLoaderData() as ReviewDeckData;
  return <PracticeCard initialReviewData={reviewData} />;
}
