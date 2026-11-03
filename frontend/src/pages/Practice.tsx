import PracticeCard from '@/features/practice/PracticeCard';
import { ROUTES } from '@/config/routes.config';
import type { ReviewKind } from '@/types/practice.types';
import { useLocation } from 'react-router-dom';
import type { JSX } from 'react';

/**
 * Practice page component.
 * @returns The rendered Practice page component.
 */
export default function Practice(): JSX.Element {
  const { pathname } = useLocation();
  const reviewKind: ReviewKind = pathname === ROUTES.vocabularyPractice ? 'vocabulary' : 'grammar';
  return <PracticeCard reviewKind={reviewKind} />;
}
