import TopicsOverview from '@/features/topics/TopicsOverview';
import type { JSX } from 'react';
import { useLoaderData } from 'react-router-dom';
import type { GroupType } from '@/types/table.types';

/**
 * Renders the Topics page component.
 * @returns A JSX element representing the topics overview.
 */
export default function Topics(): JSX.Element {
  const topics = useLoaderData() as GroupType[];
  return <TopicsOverview initialTopics={topics} />;
}
