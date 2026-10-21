import { DataState } from '@/components/UI/DataState';
import OverviewCard from '@/components/UI/OverviewCard';
import BilingualItemButton from '@/components/UI/buttons/BilingualItemButton';
import { ROUTES } from '@/config/routes.config';
import SoundGroup from '@/database/models/sound-groups';
import { useAuthStore } from '@/features/auth/use-auth-store';
import { useAudioManager } from '@/features/audio/use-audio-manager';
import VolumeSlider from '@/features/audio/VolumeSlider';
import { reportError } from '@/features/logging/monitoring-handler';
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

async function playItemAudio(
  audio: string | null,
  playAudio: (source: string) => Promise<boolean>,
  showToast: (message: string, type: 'error') => void,
): Promise<void> {
  if (!audio) return;
  if (!(await playAudio(audio))) showToast(TEXTS.noAudio, 'error');
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
  const audios = useMemo(
    () => data?.items.flatMap((item) => item.audio ? [item.audio] : []) ?? [],
    [data],
  );
  const { playAudio, isAudioReady, loading: audioLoading } = useAudioManager(audios);

  useEffect(() => {
    if (groupId) return;
    void navigate(ROUTES.sounds, { replace: true });
  }, [groupId, navigate]);

  useEffect(() => {
    if (loading || !userId || !groupId || data !== null) return;
    void navigate(ROUTES.sounds, { replace: true });
  }, [data, groupId, loading, navigate, userId]);

  useEffect(() => {
    if (!error) return;
    showToast(TEXTS.loadingError, 'error');
    reportError('Failed to fetch sound group detail', error);
  }, [error, showToast]);

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
          <p className="px-4 pt-2 text-left font-normal whitespace-pre-line">{data.group.note}</p>
        )}
        <div className="flex flex-col gap-1 pt-1">
          {items.map((item) => (
            <BilingualItemButton
              key={item.item_id}
              item={item}
              onClick={() => playItemAudio(item.audio, playAudio, showToast)}
              disabled={!item.audio || audioLoading || !isAudioReady(item.audio)}
            />
          ))}
        </div>
        <SoundDetailControls items={items} />
      </DataState>
    </OverviewCard>
  );
}
