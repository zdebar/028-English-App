import { DataState } from '@/components/UI/DataState';
import OverviewCard from '@/components/UI/OverviewCard';
import BilingualItemButton from '@/components/UI/buttons/BilingualItemButton';
import SecondaryControlButton from '@/components/UI/buttons/SecondaryControlButton';
import MicrophoneIcon from '@/components/UI/icons/MicrophoneIcon';
import { ROUTES } from '@/config/routes.config';
import PronunciationGroup from '@/database/models/pronunciation-groups';
import { useAudioManager } from '@/features/audio/use-audio-manager';
import VolumeSlider from '@/features/audio/VolumeSlider';
import { reportError } from '@/features/logging/monitoring-handler';
import { useAuthStore } from '@/features/auth/use-auth-store';
import HelpButton from '@/features/help/HelpButton';
import HelpText from '@/features/help/HelpText';
import { useToastStore } from '@/features/toast/use-toast-store';
import { useLiveQueryData } from '@/hooks/use-live-query-data';
import { TEXTS } from '@/locales/cs';
import { useCallback, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { PronunciationGroupDetailType } from '@/types/pronunciation.types';
import { invalidateRouteData, routeDataKey } from '@/routing/route-data-handoff';

export default function PronunciationGroupDetail({
  initialData,
}: Readonly<{ initialData?: PronunciationGroupDetailType | null }>) {
  const userId = useAuthStore((state) => state.userId);
  const showToast = useToastStore((state) => state.showToast);
  const navigate = useNavigate();
  const { groupId: groupIdText } = useParams<{ groupId: string }>();
  const groupId = Number(groupIdText);
  const validGroupId = Number.isSafeInteger(groupId) && groupId > 0 ? groupId : null;
  const fetchDetail = useCallback(
    () =>
      userId && validGroupId
        ? PronunciationGroup.getDetail(userId, validGroupId)
        : Promise.resolve(null),
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

  useEffect(() => {
    if (validGroupId) return;
    navigate(ROUTES.pronunciationGroups, { replace: true });
  }, [navigate, validGroupId]);

  useEffect(() => {
    if (loading || !userId || !validGroupId || data !== null) return;
    navigate(ROUTES.pronunciationGroups, { replace: true });
  }, [data, loading, navigate, userId, validGroupId]);

  useEffect(() => {
    if (!error) return;
    showToast(TEXTS.loadingError, 'error');
    reportError('Failed to fetch pronunciation group detail', error);
  }, [error, showToast]);

  const addGroup = async () => {
    if (!userId || !validGroupId) return;
    try {
      await PronunciationGroup.addAvailableItems(userId, validGroupId);
      invalidateRouteData(routeDataKey('pronunciation-group-detail', userId, validGroupId));
    } catch (error) {
      reportError('Failed to add pronunciation group', error);
      showToast(TEXTS.pronunciationGroupAddError, 'error');
    }
  };

  const allSelected =
    Boolean(data?.available_count) && data?.selected_count === data?.available_count;
  const groupActionLabel = allSelected
    ? TEXTS.pronunciationGroupAdded
    : TEXTS.addPronunciationGroup;

  return (
    <OverviewCard
      buttonTitle={data?.group.name}
      loading={loading}
      onClose={() => navigate(ROUTES.pronunciationGroups)}
      className="bottom-controls-clearance"
    >
      <DataState
        loading={loading}
        hasData={Boolean(data?.items.length)}
        noDataMessage={TEXTS.noPronunciationGroupItems}
      >
        <div className="flex flex-col gap-1 pt-1">
          {data?.items.map((item) => (
            <BilingualItemButton
              key={item.item_id}
              item={item}
              disabled={!item.audio || audioLoading || !isAudioReady(item.audio)}
              onClick={async () => {
                if (!item.audio) return;
                const didPlay = await playAudio(item.audio);
                if (!didPlay) showToast(TEXTS.noAudio, 'error');
              }}
            />
          ))}
        </div>
      </DataState>
      <div className="pos-bottom-left-control">
        <VolumeSlider />
      </div>
      {data?.items.length ? (
        <div className="pos-bottom-right-control">
          <SecondaryControlButton
            ariaLabel={groupActionLabel}
            title={groupActionLabel}
            aria-pressed={allSelected}
            disabled={allSelected || !data.available_count}
            onClick={() => {
              void addGroup();
            }}
          >
            <MicrophoneIcon />
            <HelpText className="right-2 -bottom-4 flex flex-col items-end landscape:invisible">
              {TEXTS.addToPronunciationHelp}
            </HelpText>
          </SecondaryControlButton>
          <HelpButton />
        </div>
      ) : null}
    </OverviewCard>
  );
}
