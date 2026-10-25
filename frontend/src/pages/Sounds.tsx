import SoundsOverview from '@/features/sounds/SoundsOverview';
import { useLoaderData } from 'react-router-dom';
import type { SoundOverviewGroup } from '@/database/models/sound-groups';

export default function Sounds() {
  const sounds = useLoaderData() as SoundOverviewGroup[];
  return <SoundsOverview initialSounds={sounds} />;
}
