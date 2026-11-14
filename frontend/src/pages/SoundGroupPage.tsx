import SoundGroupDetail from '@/features/sounds/SoundGroupDetail';
import type { AudioCacheSnapshot } from '@/features/audio/use-audio-loader';
import { useLoaderData } from 'react-router-dom';

export default function SoundGroupPage() {
  const audioCacheSnapshot = useLoaderData() as AudioCacheSnapshot;
  return <SoundGroupDetail audioCacheSnapshot={audioCacheSnapshot} />;
}
