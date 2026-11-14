import VocabularyOverview from '@/features/vocabulary/VocabularOverview';
import type { AudioCacheSnapshot } from '@/features/audio/use-audio-loader';
import type { JSX } from 'react';
import { useLoaderData } from 'react-router-dom';

/**
 * Vocabulary page component.
 * @returns The rendered Vocabulary page component.
 */
export default function Vocabulary(): JSX.Element {
  const audioCacheSnapshot = useLoaderData() as AudioCacheSnapshot;
  return <VocabularyOverview audioCacheSnapshot={audioCacheSnapshot} />;
}
