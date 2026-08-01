import PronunciationOverview from '@/features/pronunciation/PronunciationOverview';
import { useLoaderData } from 'react-router-dom';
import type { PronunciationGroupOverviewType } from '@/types/pronunciation.types';

export default function PronunciationOverviewPage() {
  const groups = useLoaderData() as PronunciationGroupOverviewType[];
  return <PronunciationOverview initialGroups={groups} />;
}
