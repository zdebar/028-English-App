import SoundsOverview from '@/features/sounds/SoundsOverview';
import { useLoaderData } from 'react-router-dom';
import type { SoundOverviewGroup } from '@/database/queries/sound-group-queries';

export default function Sounds() {
  const sounds = useLoaderData() as SoundOverviewGroup[];
  return <SoundsOverview initialSounds={sounds} />;
}
