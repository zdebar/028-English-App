import TopicItemsOverview from '@/features/topics/TopicItemsOverview';
import type { AudioCacheSnapshot } from '@/features/audio/use-audio-loader';
import type { JSX } from 'react';
import { useLoaderData } from 'react-router-dom';

/**
 * TopicItems page component.
 * @returns The rendered TopicItems page component.
 */
export default function TopicItems(): JSX.Element {
  const audioCacheSnapshot = useLoaderData() as AudioCacheSnapshot;
  return <TopicItemsOverview audioCacheSnapshot={audioCacheSnapshot} />;
}
