import { sharedQueryKey } from '@/hooks/shared-query-store';
import { DataState } from '@/components/UI/DataState';
import OverviewCard from '@/components/UI/OverviewCard';
import AudioItemList from '@/components/UI/AudioItemList';
import { ROUTES } from '@/config/routes.config';
import PronunciationGroup from '@/database/models/pronunciation-groups';
import { useAudioManager } from '@/features/audio/use-audio-manager';
import { getItemAudioSources } from '@/features/audio/audio.utils';
import VolumeSlider from '@/features/audio/VolumeSlider';
import { useQueryErrorToast } from '@/features/logging/use-query-error-toast';
import { useAuthStore } from '@/features/auth/use-auth-store';
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

function PronunciationGroupNote({ note }: Readonly<{ note: string | null | undefined }>) {
  if (!note) return null;
  return <p className="p-4 text-left font-normal whitespace-pre-line">{note}</p>;
}

function RelatedPronunciationSounds({
  sounds,
}: Readonly<{ sounds: PronunciationGroupDetailType['sounds'] }>) {
  return (
    <div className="mt-1 flex flex-col gap-1">
      {sounds.map((sound) => (
        <div key={sound.id} className="flex flex-col gap-1">
          <div className="h-input border-disabled-light text-light dark:border-disabled-dark dark:text-dark flex w-full items-center justify-center border border-dashed text-center">
            {sound.name}
          </div>
          {sound.note && (
            <p className="p-4 text-left font-normal whitespace-pre-line">{sound.note}</p>
          )}
        </div>
      ))}
    </div>
  );
}

function PronunciationDetailControls({
  items,
}: Readonly<{ items: PronunciationGroupDetailType['items'] }>) {
  if (items.length === 0) return null;
  const hasAudio = items.some((item) => Boolean(item.audio?.trim()));

  return (
    <div className="secondary-controls-after-list">
      <div className="pos-bottom-left-control">
        <VolumeSlider disabled={!hasAudio} />
      </div>
    </div>
  );
}

function redirectToPronunciationGroups(navigate: ReturnType<typeof useNavigate>): void {
  void navigate(ROUTES.pronunciationGroups, { replace: true });
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

function PronunciationGroupOverviewCard({
  data,
  loading,
  closeRoute,
  audioLoading,
  isAudioReady,
  playAudio,
  showToast,
}: Readonly<{
  data: PronunciationGroupDetailType | null;
  loading: boolean;
  closeRoute: () => void;
  audioLoading: boolean;
  isAudioReady: (audio: string) => boolean;
  playAudio: (audio: string) => Promise<boolean>;
  showToast: (message: string, type: 'error') => void;
}>) {
  return (
    <OverviewCard
      buttonTitle={data?.group.name}
      loading={loading}
      onClose={closeRoute}
      className="card-height min-h-card"
      showResetAction={false}
    >
      <DataState
        loading={loading}
        hasData={Boolean(data)}
        noDataMessage={TEXTS.noPronunciationGroupItems}
      >
        <PronunciationGroupNote note={data?.group.note} />
        <RelatedPronunciationSounds sounds={data?.sounds ?? []} />
        <AudioItemList
          items={data?.items ?? []}
          audioLoading={audioLoading}
          isAudioReady={isAudioReady}
          playAudio={playAudio}
          showToast={showToast}
          showPronunciation
          itemClassName="min-w-0 grow"
        />
        <PronunciationDetailControls items={data?.items ?? []} />
      </DataState>
    </OverviewCard>
  );
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
    sharedKey: sharedQueryKey(userId, `pronunciation:${validGroupId}`),
  });
  const audios = useMemo(() => getItemAudioSources(data?.items ?? []), [data]);
  const { playAudio, isAudioReady, loading: audioLoading } = useAudioManager(audios);
  usePronunciationGroupNavigation(validGroupId, loading, userId, data, navigate);

  useQueryErrorToast(error, 'Failed to fetch pronunciation group detail');

  return (
    <PronunciationGroupOverviewCard
      data={data}
      loading={loading}
      closeRoute={closeRoute}
      audioLoading={audioLoading}
      isAudioReady={isAudioReady}
      playAudio={playAudio}
      showToast={showToast}
    />
  );
}
