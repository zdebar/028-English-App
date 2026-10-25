import { sharedQueryKey } from '@/hooks/shared-query-store';
import { DataState } from '@/components/UI/DataState';
import OverviewCard from '@/components/UI/OverviewCard';
import AudioItemList from '@/components/UI/AudioItemList';
import BilingualItemButton from '@/components/UI/buttons/BilingualItemButton';
import { ListButton } from '@/components/UI/buttons/ListButton';
import { ROUTES } from '@/config/routes.config';
import PronunciationGroup from '@/database/models/pronunciation-groups';
import { useAudioManager } from '@/features/audio/use-audio-manager';
import { getItemAudioSources, playAudioWithToast } from '@/features/audio/audio.utils';
import VolumeSlider from '@/features/audio/VolumeSlider';
import { useQueryErrorToast } from '@/features/logging/use-query-error-toast';
import { useAuthStore } from '@/features/auth/use-auth-store';
import { useToastStore } from '@/features/toast/use-toast-store';
import { useLiveQueryData } from '@/hooks/use-live-query-data';
import { TEXTS } from '@/locales/cs';
import { useCallback, useEffect, useMemo, useRef, useState, type JSX } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { PronunciationGroupDetailType } from '@/types/pronunciation.types';
import { useRouteClose } from '@/routing/use-route-close';
import type { UserItemLocal } from '@/types/user-item.types';

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

type RandomWordPhase = 'initial' | 'reveal' | 'revealed';

function chooseRandomItem(
  items: readonly UserItemLocal[],
  remainingIds: number[],
  previousItemId: number | null,
): { item: UserItemLocal; remainingIds: number[] } | null {
  const availableIds = new Set(items.map((item) => item.item_id));
  let cycleIds = remainingIds.filter((itemId) => availableIds.has(itemId));
  if (cycleIds.length === 0) cycleIds = [...availableIds];
  let pool = cycleIds;
  if (pool.length > 1 && previousItemId !== null) {
    const withoutPrevious = pool.filter((itemId) => itemId !== previousItemId);
    if (withoutPrevious.length > 0) pool = withoutPrevious;
  }

  const selectedId = pool[Math.floor(Math.random() * pool.length)];
  const item = items.find((candidate) => candidate.item_id === selectedId);
  if (!item) return null;

  return {
    item,
    remainingIds: cycleIds.filter((itemId) => itemId !== selectedId),
  };
}

function RandomPronunciationPractice({
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
  const [phase, setPhase] = useState<RandomWordPhase>('initial');
  const [selectedItem, setSelectedItem] = useState<UserItemLocal | null>(null);
  const remainingItemIds = useRef<number[]>([]);
  const previousItemId = useRef<number | null>(null);
  const itemSetKey = items.map((item) => item.item_id).join(',');
  const playableItems = items.filter(
    (item) => item.audio?.trim() && (audioLoading || isAudioReady(item.audio)),
  );

  useEffect(() => {
    setPhase('initial');
    setSelectedItem(null);
    remainingItemIds.current = [];
    previousItemId.current = null;
  }, [itemSetKey]);

  const playRandomWord = async () => {
    const nextSelection = chooseRandomItem(
      playableItems,
      remainingItemIds.current,
      previousItemId.current,
    );
    if (!nextSelection) return;

    remainingItemIds.current = nextSelection.remainingIds;
    previousItemId.current = nextSelection.item.item_id;
    setSelectedItem(nextSelection.item);
    setPhase('reveal');
    await playAudioWithToast(nextSelection.item.audio, playAudio, showToast);
  };

  if (items.length === 0) return null;

  let buttonContent: JSX.Element;
  if (phase === 'revealed' && selectedItem) {
    buttonContent = (
      <BilingualItemButton
        item={selectedItem}
        showPronunciation
        className="h-input"
        title={TEXTS.playNextRandomWordTooltip}
        disabled={playableItems.length === 0}
        onClick={playRandomWord}
      />
    );
  } else {
    buttonContent = (
      <ListButton
        className="min-h-(--height-input) shrink-0 px-4"
        disabled={playableItems.length === 0}
        onClick={() => {
          if (phase === 'initial') void playRandomWord();
          else setPhase('revealed');
        }}
      >
        {phase === 'initial' ? TEXTS.playRandomWord : TEXTS.clickToRevealRandomWord}
      </ListButton>
    );
  }

  return (
    <div className="flex flex-col gap-1 pt-1">
      {buttonContent}
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
  const items = data?.items ?? [];
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
        <RandomPronunciationPractice
          items={items}
          audioLoading={audioLoading}
          isAudioReady={isAudioReady}
          playAudio={playAudio}
          showToast={showToast}
        />
        <PronunciationGroupNote note={data?.group.note} />
        <RelatedPronunciationSounds sounds={data?.sounds ?? []} />
        <AudioItemList
          items={items}
          audioLoading={audioLoading}
          isAudioReady={isAudioReady}
          playAudio={playAudio}
          showToast={showToast}
          showPronunciation
          itemClassName="min-w-0 grow"
        />
        <PronunciationDetailControls items={items} />
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
