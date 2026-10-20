import { sharedQueryKey } from '@/hooks/shared-query-store';
import { DataState } from '@/components/UI/DataState';
import OverviewCard from '@/components/UI/OverviewCard';
import BilingualItemButton from '@/components/UI/buttons/BilingualItemButton';
import SecondaryControlButton from '@/components/UI/buttons/SecondaryControlButton';
import PronunciationIcon from '@/components/UI/icons/PronunciationIcon';
import { ROUTES } from '@/config/routes.config';
import Groups from '@/database/models/groups';
import PronunciationGroup from '@/database/models/pronunciation-groups';
import PronunciationSoundDetailCard from '@/features/practice/PronunciationSoundDetailCard';
import { useAudioManager } from '@/features/audio/use-audio-manager';
import VolumeSlider from '@/features/audio/VolumeSlider';
import { reportError } from '@/features/logging/monitoring-handler';
import { useAuthStore } from '@/features/auth/use-auth-store';
import HelpButton from '@/features/help/HelpButton';
import { useToastStore } from '@/features/toast/use-toast-store';
import { useLiveQueryData } from '@/hooks/use-live-query-data';
import { useLiveQuery } from 'dexie-react-hooks';
import { TEXTS } from '@/locales/cs';
import { splitPronunciationIntoSounds } from '@/utils/pronunciation.utils';
import type { GroupType } from '@/types/table.types';
import { useCallback, useEffect, useMemo, useState } from 'react';
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
  sounds,
  onOpenPronunciation,
}: Readonly<{
  items: PronunciationGroupDetailType['items'];
  audioLoading: boolean;
  isAudioReady: (audio: string) => boolean;
  playAudio: (audio: string) => Promise<boolean>;
  showToast: (message: string, type: 'error') => void;
  sounds: readonly GroupType[];
  onOpenPronunciation: (sounds: readonly GroupType[]) => void;
}>) {
  return (
    <div className="flex flex-col gap-1 pt-1">
      {items.map((item) => {
        const itemSounds = splitPronunciationIntoSounds(item.pronunciation ?? '', sounds);
        return (
          <div key={item.item_id} className="flex min-w-0 gap-1">
            <BilingualItemButton
              className="min-w-0 grow"
              item={item}
              disabled={!item.audio || audioLoading || !isAudioReady(item.audio)}
              onClick={() => playPronunciationItemAudio(item, playAudio, showToast)}
            />
            <SecondaryControlButton
              title={TEXTS.pronunciationGuide}
              ariaLabel={TEXTS.pronunciationGuide}
              disabled={itemSounds.length === 0}
              onClick={() => onOpenPronunciation(itemSounds)}
            >
              <PronunciationIcon />
            </SecondaryControlButton>
          </div>
        );
      })}
    </div>
  );
}

function redirectToPronunciationGroups(navigate: ReturnType<typeof useNavigate>): void {
  void navigate(ROUTES.pronunciationGroups, { replace: true });
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
  const [pronunciationSounds, setPronunciationSounds] = useState<readonly GroupType[] | null>(null);
  const [selectedSoundIndex, setSelectedSoundIndex] = useState(0);
  const allSounds = useLiveQuery(() => Groups.getSounds(), [], []) ?? [];
  const fetchDetail = useCallback(
    () => fetchGroupDetail(userId, validGroupId),
    [userId, validGroupId],
  );
  const { data, loading, error } = useLiveQueryData(fetchDetail, {
    emptyData: null,
    initialData,
    sharedKey: sharedQueryKey(userId, `pronunciation:${validGroupId}`),
  });
  const audios = useMemo(
    () => data?.items.map((item) => item.audio).filter((audio): audio is string => Boolean(audio)) ?? [],
    [data],
  );
  const { playAudio, isAudioReady, loading: audioLoading } = useAudioManager(audios);
  usePronunciationGroupNavigation(validGroupId, loading, userId, data, navigate);

  useEffect(() => {
    showPronunciationGroupError(error, showToast);
  }, [error, showToast]);

  if (pronunciationSounds) {
    return (
      <PronunciationSoundDetailCard
        sounds={pronunciationSounds}
        index={selectedSoundIndex}
        onIndexChange={setSelectedSoundIndex}
        onClose={() => setPronunciationSounds(null)}
      />
    );
  }

  return (
    <OverviewCard
      buttonTitle={data?.group.name}
      loading={loading}
      onClose={closeRoute}
      className="bottom-controls-clearance"
      showResetAction={false}
    >
      <DataState
        loading={loading}
        hasData={Boolean(data?.items.length)}
        noDataMessage={TEXTS.noPronunciationGroupItems}
      >
        {data?.group.note && (
          <p className="px-4 pt-2 text-left font-normal whitespace-pre-line">{data.group.note}</p>
        )}
        <PronunciationItems
          items={data?.items ?? []}
          audioLoading={audioLoading}
          isAudioReady={isAudioReady}
          playAudio={playAudio}
          showToast={showToast}
          sounds={allSounds}
          onOpenPronunciation={(sequence) => {
            setPronunciationSounds(sequence);
            setSelectedSoundIndex(0);
          }}
        />
      </DataState>
      <div className="pos-bottom-left-control"><VolumeSlider /></div>
      <div className="pos-bottom-right-control"><HelpButton /></div>
    </OverviewCard>
  );
}
