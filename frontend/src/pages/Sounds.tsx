import SoundsOverview from '@/features/sounds/SoundsOverview';
import { useLoaderData } from 'react-router-dom';
import type { GroupType } from '@/types/table.types';

export default function Sounds() {
  const sounds = useLoaderData() as GroupType[];
  return <SoundsOverview initialSounds={sounds} />;
}
