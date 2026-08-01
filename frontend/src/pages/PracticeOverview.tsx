import type { JSX } from 'react';
import PracticeOverviewFeature from '../features/practice-overview/PracticeOverviewFeature';
import { useLoaderData } from 'react-router-dom';
import type { UserScoreType } from '@/types/generic.types';

export default function PracticeOverview(): JSX.Element {
  const scores = useLoaderData() as UserScoreType[];
  return <PracticeOverviewFeature initialScores={scores} />;
}
