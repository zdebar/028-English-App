import TopicItemsOverview from '@/features/topics/TopicItemsOverview';
import type { JSX } from 'react';
import { useLoaderData } from 'react-router-dom';
import type { TopicDetailData } from '@/routing/route-data';

/**
 * TopicItems page component.
 * @returns The rendered TopicItems page component.
 */
export default function TopicItems(): JSX.Element {
  const data = useLoaderData() as TopicDetailData;
  return <TopicItemsOverview initialTopic={data.topic} initialItems={data.items} />;
}
