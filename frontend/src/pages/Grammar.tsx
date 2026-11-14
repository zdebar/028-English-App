import GrammarOverview from '@/features/grammar/GrammarOverview';
import type { AudioCacheSnapshot } from '@/features/audio/use-audio-loader';
import type { JSX } from 'react';
import { useLoaderData } from 'react-router-dom';

/**
 * Grammar page component.
 * @returns The rendered Grammar page component.
 */
export default function Grammar(): JSX.Element {
  const audioCacheSnapshot = useLoaderData() as AudioCacheSnapshot;
  return <GrammarOverview audioCacheSnapshot={audioCacheSnapshot} />;
}
