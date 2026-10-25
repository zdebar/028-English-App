import type { JSX } from 'react';
import PracticeOverviewFeature from '../features/practice-overview/PracticeOverviewFeature';
import { useLoaderData } from 'react-router-dom';
import type { UserLessonType } from '@/types/generic.types';

export default function PracticeOverview(): JSX.Element {
  const userLessons = useLoaderData() as UserLessonType[];
  return <PracticeOverviewFeature initialUserLessons={userLessons} />;
}
