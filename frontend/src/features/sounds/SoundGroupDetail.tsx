import { DataState } from '@/components/UI/DataState';
import OverviewCard from '@/components/UI/OverviewCard';
import AudioItemList from '@/components/UI/AudioItemList';
import { ROUTES } from '@/config/routes.config';
import { useAuthStore } from '@/features/auth/use-auth-store';
import { AudioItemListControls } from '@/features/audio/AudioItemListControls';
import { useAudioManager } from '@/features/audio/use-audio-manager';
import { getItemAudioSources } from '@/features/audio/audio.utils';
import { useQueryErrorToast } from '@/features/logging/use-query-error-toast';
import { useToastStore } from '@/features/toast/use-toast-store';
import { TEXTS } from '@/locales/cs';
import { useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useRouteClose } from '@/routing/use-route-close';
import { useCurrentUserDataPackage } from '@/database/state/use-current-user-data-package';
import type { SoundGroupDetail } from '@/database/state/data-types';
import type { AudioCacheSnapshot } from '@/features/audio/use-audio-loader';

export default function SoundGroupDetail({
  audioCacheSnapshot,
}: Readonly<{ audioCacheSnapshot?: AudioCacheSnapshot }>) {
  const userId = useAuthStore((state) => state.userId);
  const showToast = useToastStore((state) => state.showToast);
  const navigate = useNavigate();
  const { groupId: groupIdText } = useParams<{ groupId: string }>();
  const groupId = parseGroupId(groupIdText);
  const closeRoute = useRouteClose(ROUTES.sounds);
  const { data: packageData, loading, error } = useCurrentUserDataPackage(userId, {
    kind: 'sound-detail',
    groupId: groupId ?? 0,
  });
  const data = packageData ?? null;
  const audios = useMemo(() => getItemAudioSources(data?.items ?? []), [data]);
  const { playAudio, isAudioReady } = useAudioManager(audios, audioCacheSnapshot);

  useEffect(() => {
    if (groupId) return;
    void navigate(ROUTES.sounds, { replace: true });
  }, [groupId, navigate]);

  useEffect(() => {
    if (!shouldRedirectForMissingData(loading, error, userId, groupId, data)) return;
    void navigate(ROUTES.sounds, { replace: true });
  }, [data, error, groupId, loading, navigate, userId]);

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
          isAudioReady={isAudioReady}
          playAudio={playAudio}
          showToast={showToast}
          showPronunciation
          hideCzechOnNarrow
        />
        <AudioItemListControls items={items} />
      </DataState>
    </OverviewCard>
  );
}

function parseGroupId(value: string | undefined): number | null {
  const groupId = Number(value);
  return Number.isSafeInteger(groupId) && groupId > 0 ? groupId : null;
}

function shouldRedirectForMissingData(
  loading: boolean,
  error: Error | null,
  userId: string | null,
  groupId: number | null,
  data: SoundGroupDetail | null,
): boolean {
  return !loading && !error && Boolean(userId) && Boolean(groupId) && data === null;
}
