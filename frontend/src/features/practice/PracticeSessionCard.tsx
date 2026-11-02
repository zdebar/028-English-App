import { useDataManager } from '@/database/state/data-store';
import { TEXTS } from '@/locales/cs';
import {
  getSoundsFromPronunciationSegments,
  getUniquePronunciationSounds,
  type PronunciationSegment,
} from '@/features/pronunciation/pronunciation.utils';
import { useEffect, useRef, useState } from 'react';
import PracticeSessionDetail from './PracticeSessionDetail';
import PracticeSessionCardView from './PracticeSessionCardView';
import type {
  NormalizedPracticeSessionCardProps,
  PracticeDetail,
  PracticeSessionCardProps,
} from './practice-session-card.types';

export type { PracticeDetail, PracticeSessionCardProps } from './practice-session-card.types';

const DEFAULT_PRACTICE_SESSION_CARD_PROPS = {
  itemProgressHelpText: TEXTS.itemProgress,
  progressHelpText: TEXTS.reviewProgress,
  repeatDisabled: false,
  completeDisabled: false,
  isInitialTrainingPractice: false,
  showProgressLabel: false,
  czechHidden: false,
} as const;

/** Displays one practice card and its related detail panels. */
export default function PracticeSessionCard(props: PracticeSessionCardProps) {
  const normalizedProps = normalizePracticeSessionCardProps(props);
  const groups = useDataManager((state) => state.groups);
  const sounds = groups.filter((group) => group.type === 'sound' && !group.deleted_at);
  const [visibleDetail, setVisibleDetail] = useState<PracticeDetail | null>(null);
  const [pronunciationSegments, setPronunciationSegments] = useState<readonly PronunciationSegment[]>([]);
  const [selectedSoundIndex, setSelectedSoundIndex] = useState(0);
  const reportedDetailFailuresRef = useRef(new Set<string>());

  useEffect(() => {
    reportedDetailFailuresRef.current.clear();
  }, [normalizedProps.itemKey]);

  const handleDetailLoadError = (detail: PracticeDetail): void => {
    const failureKey = `${normalizedProps.itemKey ?? 'current'}:${detail}`;
    if (reportedDetailFailuresRef.current.has(failureKey)) return;
    reportedDetailFailuresRef.current.add(failureKey);
    normalizedProps.onDetailLoadError?.(detail);
  };

  if (visibleDetail) {
    return (
      <PracticeSessionDetail
        visibleDetail={visibleDetail}
        grammar={normalizedProps.grammar}
        note={normalizedProps.note}
        sounds={getUniquePronunciationSounds(
          getSoundsFromPronunciationSegments(pronunciationSegments),
        )}
        pronunciationSegments={pronunciationSegments}
        audio={normalizedProps.audio}
        selectedSoundIndex={selectedSoundIndex}
        onClose={() => setVisibleDetail(null)}
        onSoundIndexChange={setSelectedSoundIndex}
      />
    );
  }

  return (
    <PracticeSessionCardView
      props={normalizedProps}
      sounds={sounds}
      setVisibleDetail={setVisibleDetail}
      onDetailLoadError={handleDetailLoadError}
      onOpenPronunciation={(segments) => {
        setPronunciationSegments(segments);
        setSelectedSoundIndex(0);
        setVisibleDetail('pronunciation');
      }}
    />
  );
}

function normalizePracticeSessionCardProps(
  props: PracticeSessionCardProps,
): NormalizedPracticeSessionCardProps {
  return { ...DEFAULT_PRACTICE_SESSION_CARD_PROPS, ...props } as NormalizedPracticeSessionCardProps;
}
