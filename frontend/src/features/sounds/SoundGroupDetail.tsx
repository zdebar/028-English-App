import { DataState } from '@/components/UI/DataState';
import OverviewCard from '@/components/UI/OverviewCard';
import AudioItemList from '@/components/UI/AudioItemList';
import { ROUTES } from '@/config/routes.config';
import SoundGroup from '@/database/models/sound-groups';
import { useAuthStore } from '@/features/auth/use-auth-store';
import { useAudioManager } from '@/features/audio/use-audio-manager';
import { getItemAudioSources } from '@/features/audio/audio.utils';
import VolumeSlider from '@/features/audio/VolumeSlider';
import { useQueryErrorToast } from '@/features/logging/use-query-error-toast';
import { useToastStore } from '@/features/toast/use-toast-store';
import { sharedQueryKey } from '@/hooks/shared-query-store';
import { useLiveQueryData } from '@/hooks/use-live-query-data';
import { TEXTS } from '@/locales/cs';
import type { SoundGroupDetailType } from '@/database/models/sound-groups';
import { useCallback, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useRouteClose } from '@/routing/use-route-close';

function parseGroupId(value: string | undefined): number | null {
  const groupId = Number(value);
  return Number.isSafeInteger(groupId) && groupId > 0 ? groupId : null;
}

function SoundDetailControls({
  items,
}: Readonly<{ items: SoundGroupDetailType['items'] }>) {
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

export default function SoundGroupDetail({
  initialData,
}: Readonly<{ initialData?: SoundGroupDetailType | null }>) {
  const userId = useAuthStore((state) => state.userId);
  const showToast = useToastStore((state) => state.showToast);
  const navigate = useNavigate();
  const { groupId: groupIdText } = useParams<{ groupId: string }>();
  const groupId = parseGroupId(groupIdText);
  const closeRoute = useRouteClose(ROUTES.sounds);
  const fetchDetail = useCallback(() => {
    if (!userId || !groupId) return Promise.resolve(null);
    return SoundGroup.getDetail(userId, groupId);
  }, [groupId, userId]);
  const { data, loading, error } = useLiveQueryData<SoundGroupDetailType | null>(fetchDetail, {
    emptyData: null,
    initialData,
    sharedKey: sharedQueryKey(userId, `sound:${groupId}`),
  });
  const audios = useMemo(() => getItemAudioSources(data?.items ?? []), [data]);
  const { playAudio, isAudioReady, loading: audioLoading } = useAudioManager(audios);

  useEffect(() => {
    if (groupId) return;
    void navigate(ROUTES.sounds, { replace: true });
  }, [groupId, navigate]);

  useEffect(() => {
    if (loading || !userId || !groupId || data !== null) return;
    void navigate(ROUTES.sounds, { replace: true });
  }, [data, groupId, loading, navigate, userId]);

  useQueryErrorToast(error, 'Failed to fetch sound group detail');

  const items = data?.items ?? [];
  return (
    <OverviewCard
      buttonTitle={data?.group.name}
      loading={loading}
      onClose={closeRoute}
      className="card-height min-h-card"
      showResetAction={false}
      titleAlignment="center"
    >
      <DataState loading={loading} hasData={Boolean(data)} noDataMessage={TEXTS.noSoundItems}>
        {data?.group.note && (
          <p className="p-4 text-left font-normal whitespace-pre-line">{data.group.note}</p>
        )}
        <AudioItemList
          items={items}
          audioLoading={audioLoading}
          isAudioReady={isAudioReady}
          playAudio={playAudio}
          showToast={showToast}
          showPronunciation
          hideCzechOnNarrow
        />
        <SoundDetailControls items={items} />
      </DataState>
    </OverviewCard>
  );
}
