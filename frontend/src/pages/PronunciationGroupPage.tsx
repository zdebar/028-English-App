import PronunciationGroupDetail from '@/features/pronunciation/PronunciationGroupDetail';
import type { PronunciationGroupDetailType } from '@/types/pronunciation.types';
import { useLoaderData } from 'react-router-dom';

export default function PronunciationGroupPage() {
  const data = useLoaderData() as PronunciationGroupDetailType;
  return <PronunciationGroupDetail initialData={data} />;
}
