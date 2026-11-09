import PracticeCard from '@/features/practice/PracticeCard';
import { ROUTES } from '@/config/routes.config';
import type { ReviewDirection, ReviewKind } from '@/types/practice.types';
import { useLocation, useSearchParams } from 'react-router-dom';
import type { JSX } from 'react';

/**
 * Practice page component.
 * @returns The rendered Practice page component.
 */
export default function Practice(): JSX.Element {
  const { pathname } = useLocation();
  const [searchParams] = useSearchParams();
  const reviewKind: ReviewKind = pathname === ROUTES.vocabularyPractice ? 'vocabulary' : 'grammar';
  const reviewDirection = getReviewDirection(searchParams.get('direction'));

  return (
    <PracticeCard
      key={`${reviewKind}:${reviewDirection ?? 'auto'}`}
      reviewKind={reviewKind}
      reviewDirection={reviewDirection}
    />
  );
}

function getReviewDirection(value: string | null): ReviewDirection | undefined {
  if (value === 'cz_to_en' || value === 'en_to_cz') return value;
  return undefined;
}
