import type { JSX } from 'react';
import PracticeOverviewFeature from '../features/practice-overview/PracticeOverviewFeature';
import { useLoaderData } from 'react-router-dom';
import type { UserItemProgressHistoryType } from '@/types/user-item.types';

export default function PracticeOverview(): JSX.Element {
  const history = useLoaderData() as UserItemProgressHistoryType[];
  return <PracticeOverviewFeature initialHistory={history} />;
}
