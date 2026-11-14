import PronunciationGroupDetail from '@/features/pronunciation/PronunciationGroupDetail';
import type { AudioCacheSnapshot } from '@/features/audio/use-audio-loader';
import { useLoaderData } from 'react-router-dom';

export default function PronunciationGroupPage() {
  const audioCacheSnapshot = useLoaderData() as AudioCacheSnapshot;
  return <PronunciationGroupDetail audioCacheSnapshot={audioCacheSnapshot} />;
}
