import { DataState } from '@/components/UI/DataState';
import OverviewCard from '@/components/UI/OverviewCard';
import BilingualItemButton from '@/components/UI/buttons/BilingualItemButton';
import { ROUTES } from '@/config/routes.config';
import PronunciationGroup from '@/database/models/pronunciation-groups';
import { useAudioManager } from '@/features/audio/use-audio-manager';
import VolumeSlider from '@/features/audio/VolumeSlider';
import { reportError } from '@/features/logging/monitoring-handler';
import { useAuthStore } from '@/features/auth/use-auth-store';
import HelpButton from '@/features/help/HelpButton';
import { useToastStore } from '@/features/toast/use-toast-store';
import { useLiveQueryData } from '@/hooks/use-live-query-data';
import { TEXTS } from '@/locales/cs';
import { useCallback, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { PronunciationGroupDetailType } from '@/types/pronunciation.types';
import { useRouteClose } from '@/routing/use-route-close';

function parseGroupId(value: string | undefined): number | null {
  const groupId = Number(value);
  if (!Number.isSafeInteger(groupId) || groupId <= 0) return null;
  return groupId;
}

function fetchGroupDetail(userId: string | null, groupId: number | null) {
  if (!userId || !groupId) return Promise.resolve(null);
  return PronunciationGroup.getDetail(userId, groupId);
}

async function playPronunciationItemAudio(
  item: PronunciationGroupDetailType['items'][number],
  playAudio: (audio: string) => Promise<boolean>,
  showToast: (message: string, type: 'error') => void,
): Promise<void> {
  if (!item.audio) return;
  const didPlay = await playAudio(item.audio);
  if (!didPlay) showToast(TEXTS.noAudio, 'error');
}

function PronunciationItems({
  items,
  audioLoading,
  isAudioReady,
  playAudio,
  showToast,
}: Readonly<{
  items: PronunciationGroupDetailType['items'];
  audioLoading: boolean;
  isAudioReady: (audio: string) => boolean;
  playAudio: (audio: string) => Promise<boolean>;
  showToast: (message: string, type: 'error') => void;
}>) {
  return (
    <div className="flex flex-col gap-1 pt-1">
      {items.map((item) => (
        <BilingualItemButton
          key={item.item_id}
          item={item}
          disabled={!item.audio || audioLoading || !isAudioReady(item.audio)}
          onClick={() => playPronunciationItemAudio(item, playAudio, showToast)}
        />
      ))}
    </div>
  );
}

function redirectToPronunciationGroups(navigate: ReturnType<typeof useNavigate>): void {
  navigate(ROUTES.pronunciationGroups, { replace: true });
}

function showPronunciationGroupError(
  error: Error | null,
  showToast: (message: string, type: 'error') => void,
): void {
  if (!error) return;
  showToast(TEXTS.loadingError, 'error');
  reportError('Failed to fetch pronunciation group detail', error);
}

function usePronunciationGroupNavigation(
  validGroupId: number | null,
  loading: boolean,
  userId: string | null,
  data: PronunciationGroupDetailType | null,
  navigate: ReturnType<typeof useNavigate>,
): void {
  useEffect(() => {
    if (validGroupId) return;
    redirectToPronunciationGroups(navigate);
  }, [navigate, validGroupId]);

  useEffect(() => {
    if (loading || !userId || !validGroupId || data !== null) return;
    redirectToPronunciationGroups(navigate);
  }, [data, loading, navigate, userId, validGroupId]);
}

export default function PronunciationGroupDetail({
  initialData,
}: Readonly<{ initialData?: PronunciationGroupDetailType | null }>) {
  const userId = useAuthStore((state) => state.userId);
  const showToast = useToastStore((state) => state.showToast);
  const navigate = useNavigate();
  const closeRoute = useRouteClose(ROUTES.pronunciationGroups);
  const { groupId: groupIdText } = useParams<{ groupId: string }>();
  const validGroupId = parseGroupId(groupIdText);
  const fetchDetail = useCallback(
    () => fetchGroupDetail(userId, validGroupId),
    [userId, validGroupId],
  );
  const { data, loading, error } = useLiveQueryData(fetchDetail, {
    emptyData: null,
    initialData,
  });
  const audios = useMemo(
    () =>
      data?.items.map((item) => item.audio).filter((audio): audio is string => Boolean(audio)) ??
      [],
    [data],
  );
  const { playAudio, isAudioReady, loading: audioLoading } = useAudioManager(audios);
  usePronunciationGroupNavigation(validGroupId, loading, userId, data, navigate);

  useEffect(() => {
    showPronunciationGroupError(error, showToast);
  }, [error, showToast]);

  return (
    <OverviewCard
      buttonTitle={data?.group.name}
      loading={loading}
      onClose={closeRoute}
      className="bottom-controls-clearance"
    >
      <DataState
        loading={loading}
        hasData={Boolean(data?.items.length)}
        noDataMessage={TEXTS.noPronunciationGroupItems}
      >
        <PronunciationItems
          items={data?.items ?? []}
          audioLoading={audioLoading}
          isAudioReady={isAudioReady}
          playAudio={playAudio}
          showToast={showToast}
        />
      </DataState>
      <div className="pos-bottom-left-control">
        <VolumeSlider />
      </div>
      <div className="pos-bottom-right-control">
        <HelpButton />
      </div>
    </OverviewCard>
  );
}
