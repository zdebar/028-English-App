import SoundGroupDetail from '@/features/sounds/SoundGroupDetail';
import type { SoundGroupDetailData } from '@/routing/route-data';
import { useLoaderData } from 'react-router-dom';

export default function SoundGroupPage() {
  const data = useLoaderData() as SoundGroupDetailData;
  return <SoundGroupDetail initialData={data} />;
}
