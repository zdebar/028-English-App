import { sharedQueryKey } from '@/hooks/shared-query-store';
import { DataState } from '@/components/UI/DataState';
import OverviewCard from '@/components/UI/OverviewCard';
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
import { useLocalStorageSync } from '@/hooks/use-local-storage-sync';
import { TEXTS } from '@/locales/cs';
import { useCallback, useEffect, useMemo, useRef, useState, type JSX } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { PronunciationGroupDetailType } from '@/types/pronunciation.types';
import { useRouteClose } from '@/routing/use-route-close';
import type { UserItemLocal } from '@/types/user-item.types';
import { reportError } from '@/features/logging/monitoring-handler';

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
const RANDOM_WORD_REVEAL_TIMEOUT_MS = 5000;
const EMPTY_SELECTED_ITEM_IDS: number[] = [];

function chooseRandomItem(
  items: readonly UserItemLocal[],
): UserItemLocal | null {
  if (items.length === 0) return null;
  return items[Math.floor(Math.random() * items.length)] ?? null;
}

function RandomPronunciationPractice({
  items,
  initialLabel,
  minimumPlayableItems = 1,
  reserveTrailingSpace = false,
  audioLoading,
  isAudioReady,
  playAudio,
  showToast,
}: Readonly<{
  items: PronunciationGroupDetailType['items'];
  initialLabel: string;
  minimumPlayableItems?: number;
  reserveTrailingSpace?: boolean;
  audioLoading: boolean;
  isAudioReady: (audio: string) => boolean;
  playAudio: (audio: string) => Promise<boolean>;
  showToast: (message: string, type: 'error') => void;
}>) {
  const [phase, setPhase] = useState<RandomWordPhase>('initial');
  const [selectedItem, setSelectedItem] = useState<UserItemLocal | null>(null);
  const itemSetKey = items.map((item) => item.item_id).join(',');
  const playableItems = items.filter(
    (item) => item.audio?.trim() && (audioLoading || isAudioReady(item.audio)),
  );

  useEffect(() => {
    setPhase('initial');
    setSelectedItem(null);
  }, [itemSetKey]);

  useEffect(() => {
    if (phase !== 'revealed') return;
    const timeoutId = window.setTimeout(() => {
      setPhase('initial');
      setSelectedItem(null);
    }, RANDOM_WORD_REVEAL_TIMEOUT_MS);
    return () => window.clearTimeout(timeoutId);
  }, [phase]);

  const playRandomWord = async () => {
    const selectedItem = chooseRandomItem(playableItems);
    if (!selectedItem) return;

    setSelectedItem(selectedItem);
    setPhase('reveal');
    await playAudioWithToast(selectedItem.audio, playAudio, showToast);
  };

  let buttonContent: JSX.Element;
  if (phase === 'revealed' && selectedItem) {
    buttonContent = (
      <BilingualItemButton
        item={selectedItem}
        showPronunciation
        hideCzechOnNarrow
        className={reserveTrailingSpace ? 'h-input pr-12' : 'h-input'}
        forceSingleLine={reserveTrailingSpace}
        title={TEXTS.playNextRandomWordTooltip}
        disabled={playableItems.length < minimumPlayableItems}
        onClick={playRandomWord}
      />
    );
  } else {
    buttonContent = (
      <ListButton
        className="min-h-(--height-input) shrink-0 px-4"
        disabled={playableItems.length < minimumPlayableItems}
        title={phase === 'initial' ? initialLabel : TEXTS.clickToRevealRandomWord}
        onClick={() => {
          if (phase === 'initial') void playRandomWord();
          else setPhase('revealed');
        }}
      >
        <span className="w-64 max-w-full shrink-0 overflow-hidden text-left text-ellipsis whitespace-nowrap">
          {phase === 'initial' ? initialLabel : TEXTS.clickToRevealRandomWord}
        </span>
      </ListButton>
    );
  }

  return (
    <div className="pronunciation-item-list flex flex-col gap-1">
      {buttonContent}
    </div>
  );
}

function SelectAllWordsCheckbox({
  checked,
  indeterminate,
  disabled,
  onChange,
}: Readonly<{
  checked: boolean;
  indeterminate: boolean;
  disabled: boolean;
  onChange: (checked: boolean) => void;
}>) {
  const checkboxRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (checkboxRef.current) checkboxRef.current.indeterminate = indeterminate;
  }, [indeterminate]);

  return (
    <input
      ref={checkboxRef}
      type="checkbox"
      checked={checked}
      disabled={disabled}
      aria-label={TEXTS.selectAllPronunciationWords}
      title={TEXTS.selectAllPronunciationWords}
      className="color-info absolute top-1/2 right-3 z-10 size-5 -translate-y-1/2 cursor-pointer disabled:cursor-default"
      style={{ accentColor: 'currentColor' }}
      onChange={(event) => onChange(event.target.checked)}
    />
  );
}

function hasItemAudio(item: UserItemLocal): boolean {
  return Boolean(item.audio?.trim());
}

function PronunciationGroupItems({
  items,
  selectionStorageKey,
  audioLoading,
  isAudioReady,
  playAudio,
  stopAudio,
  showToast,
}: Readonly<{
  items: PronunciationGroupDetailType['items'];
  selectionStorageKey: string;
  audioLoading: boolean;
  isAudioReady: (audio: string) => boolean;
  playAudio: (audio: string) => Promise<boolean>;
  stopAudio: () => void;
  showToast: (message: string, type: 'error') => void;
}>) {
  const [selectedItemIds, setSelectedItemIds] = useLocalStorageSync<number[]>(
    selectionStorageKey,
    EMPTY_SELECTED_ITEM_IDS,
  );
  const selectedItemIdSet = useMemo(() => new Set(selectedItemIds), [selectedItemIds]);
  const itemKey = JSON.stringify(items.map((item) => [item.item_id, item.audio]));
  const selectableItems = items.filter(hasItemAudio);
  const selectedItems = selectableItems.filter((item) => selectedItemIdSet.has(item.item_id));
  const allItemsSelected = selectableItems.length > 0 &&
    selectedItems.length === selectableItems.length;
  const someItemsSelected = selectedItems.length > 0 && !allItemsSelected;

  useEffect(() => {
    const availableIds = new Set(items.map((item) => item.item_id));
    setSelectedItemIds((previousIds) => {
      const validIds = [...previousIds].filter((itemId) => availableIds.has(itemId));
      if (validIds.length === previousIds.length) return previousIds;
      return validIds;
    });
  }, [itemKey]);

  useEffect(
    () => () => stopAudio(),
    [stopAudio],
  );

  const toggleAllItems = (checked: boolean) => {
    stopAudio();
    setSelectedItemIds(checked ? selectableItems.map((item) => item.item_id) : []);
  };

  const toggleItem = (itemId: number, checked: boolean) => {
    stopAudio();
    setSelectedItemIds((previousIds) => {
      const nextIds = new Set(previousIds);
      if (checked) nextIds.add(itemId);
      else nextIds.delete(itemId);
      return [...nextIds];
    });
  };

  const handleItemPlay = (item: UserItemLocal) => {
    stopAudio();
    void playAudioWithToast(item.audio, playAudio, showToast).catch((error: unknown) => {
      reportError('Failed to play pronunciation item', error);
    });
  };

  if (items.length === 0) return null;

  return (
    <div className="flex flex-col pt-1">
      <div className="flex flex-col gap-1">
        <RandomPronunciationPractice
          items={items}
          initialLabel={TEXTS.playAllRandomly}
          reserveTrailingSpace
          audioLoading={audioLoading}
          isAudioReady={isAudioReady}
          playAudio={playAudio}
          showToast={showToast}
        />
        <div className="relative">
          <RandomPronunciationPractice
            items={selectedItems}
            initialLabel={`${TEXTS.playSelectedRandomly} (${selectedItems.length})`}
            minimumPlayableItems={2}
            reserveTrailingSpace
            audioLoading={audioLoading}
            isAudioReady={isAudioReady}
            playAudio={playAudio}
            showToast={showToast}
          />
          <SelectAllWordsCheckbox
            checked={allItemsSelected}
            indeterminate={someItemsSelected}
            disabled={selectableItems.length === 0}
            onChange={toggleAllItems}
          />
        </div>
      </div>
      <div className="pronunciation-item-list mt-3 flex flex-col gap-1">
        {items.map((item) => {
          const hasAudio = hasItemAudio(item);
          const audio = item.audio?.trim();
          const disabled = !audio || (!audioLoading && !isAudioReady(audio));

          return (
            <div key={item.item_id} className="relative">
              <BilingualItemButton
                item={item}
                showPronunciation
                forceSingleLine
                hideCzechOnNarrow
                className="min-w-0 pr-12"
                disabled={disabled}
                onClick={() => handleItemPlay(item)}
              />
              <input
                type="checkbox"
                checked={selectedItemIdSet.has(item.item_id)}
                disabled={!hasAudio}
                aria-label={`${TEXTS.selectPronunciationWord}: ${item.czech}`}
                title={`${TEXTS.selectPronunciationWord}: ${item.czech}`}
                className="color-info absolute top-1/2 right-3 z-10 size-5 -translate-y-1/2 cursor-pointer disabled:cursor-default"
                style={{ accentColor: 'currentColor' }}
                onChange={(event) => toggleItem(item.item_id, event.target.checked)}
              />
            </div>
          );
        })}
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
  selectionStorageKey,
  loading,
  closeRoute,
  audioLoading,
  isAudioReady,
  playAudio,
  stopAudio,
  showToast,
}: Readonly<{
  data: PronunciationGroupDetailType | null;
  selectionStorageKey: string;
  loading: boolean;
  closeRoute: () => void;
  audioLoading: boolean;
  isAudioReady: (audio: string) => boolean;
  playAudio: (audio: string) => Promise<boolean>;
  stopAudio: () => void;
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
      titleAlignment="center"
    >
      <DataState
        loading={loading}
        hasData={Boolean(data)}
        noDataMessage={TEXTS.noPronunciationGroupItems}
      >
        <PronunciationGroupNote note={data?.group.note} />
        <RelatedPronunciationSounds sounds={data?.sounds ?? []} />
        <PronunciationGroupItems
          key={selectionStorageKey}
          items={items}
          selectionStorageKey={selectionStorageKey}
          audioLoading={audioLoading}
          isAudioReady={isAudioReady}
          playAudio={playAudio}
          stopAudio={stopAudio}
          showToast={showToast}
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
  const selectionStorageKey =
    `pronunciation_group_selected_words_${userId ?? 'guest'}_${validGroupId ?? 'unknown'}`;
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
  const {
    playAudio,
    stopAudio,
    isAudioReady,
    loading: audioLoading,
  } = useAudioManager(audios);
  usePronunciationGroupNavigation(validGroupId, loading, userId, data, navigate);

  useQueryErrorToast(error, 'Failed to fetch pronunciation group detail');

  return (
    <PronunciationGroupOverviewCard
      data={data}
      selectionStorageKey={selectionStorageKey}
      loading={loading}
      closeRoute={closeRoute}
      audioLoading={audioLoading}
      isAudioReady={isAudioReady}
      playAudio={playAudio}
      stopAudio={stopAudio}
      showToast={showToast}
    />
  );
}
