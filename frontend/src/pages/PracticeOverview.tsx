import type { JSX } from 'react';
import PracticeOverviewFeature from '../features/practice-overview/PracticeOverviewFeature';
import { useLoaderData } from 'react-router-dom';
import type { UserItemLocal } from '@/types/user-item.types';

export default function PracticeOverview(): JSX.Element {
  const items = useLoaderData() as UserItemLocal[];
  return <PracticeOverviewFeature initialItems={items} />;
}
