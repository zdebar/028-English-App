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
import { useDataPackage, type DataPackageResult } from '@/database/state/data-store';
import type { SoundGroupDetail } from '@/database/state/data-types';

export default function SoundGroupDetail() {
  const userId = useAuthStore((state) => state.userId);
  const showToast = useToastStore((state) => state.showToast);
  const navigate = useNavigate();
  const { groupId: groupIdText } = useParams<{ groupId: string }>();
  const groupId = parseGroupId(groupIdText);
  const closeRoute = useRouteClose(ROUTES.sounds);
  const packageState = useDataPackage({ kind: 'sound-detail', groupId: groupId ?? 0 });
  const { data, loading, error } = getSoundDetailView(userId, packageState);
  const audios = useMemo(() => getItemAudioSources(data?.items ?? []), [data]);
  const { playAudio, isAudioReady, loading: audioLoading } = useAudioManager(audios);

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
          audioLoading={audioLoading}
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
  data: ReturnType<typeof useDataPackage<{ kind: 'sound-detail'; groupId: number }>>['data'],
): boolean {
  return !loading && !error && Boolean(userId) && Boolean(groupId) && data === null;
}

function getSoundDetailView(
  userId: string | null,
  packageState: DataPackageResult<SoundGroupDetail | null>,
): Readonly<{ data: SoundGroupDetail | null; loading: boolean; error: Error | null }> {
  const isCurrentUser = packageState.userId === userId;
  return {
    data: isCurrentUser ? packageState.data ?? null : null,
    loading: Boolean(userId) && (!isCurrentUser || packageState.status === 'loading'),
    error: isCurrentUser && packageState.status === 'error' ? packageState.error : null,
  };
}
