import type { GrammarChunkWithExamples } from '@/database/queries/grammar-queries';
import type { NoteType } from '@/types/generic.types';

export type PracticeDetail = 'grammar' | 'note' | 'pronunciation';

export type PracticeSessionCardProps = Readonly<{
  note: NoteType | null;
  grammar: GrammarChunkWithExamples | null;
  noteAvailable?: boolean;
  grammarAvailable?: boolean;
  noteLoadFailed?: boolean;
  grammarLoadFailed?: boolean;
  itemKey?: string;
  ensureDetailLoaded?: (detail: PracticeDetail) => Promise<boolean>;
  onDetailLoadError?: (detail: PracticeDetail) => void;
  itemProgressLabel: string;
  progressLabel: string | number;
  itemProgressHelpText?: string;
  progressHelpText?: string;
  revealed: boolean;
  czech: string | undefined;
  czechDescription?: string | null;
  czechHidden?: boolean;
  english: string | undefined;
  pronunciation: string | undefined;
  audio?: string | null;
  audioDisabled: boolean;
  handleReveal: () => void;
  plusHint: () => void;
  nextRepeat: () => void | Promise<void>;
  repeatDisabled?: boolean;
  nextKnown?: () => void | Promise<void>;
  nextHard?: () => void | Promise<void>;
  nextGood?: () => void | Promise<void>;
  nextEasy?: () => void | Promise<void>;
  isReviewPractice?: boolean;
  completeCurrent?: () => void | Promise<void>;
  completeDisabled?: boolean;
  retryAction?: () => void | Promise<void>;
  audioError: boolean;
  playAudio: () => void;
  audioLoading: boolean;
  isInitialTrainingPractice?: boolean;
  showProgressLabel?: boolean;
  isContentLoading?: boolean;
}>;

export type NormalizedPracticeSessionCardProps = PracticeSessionCardProps &
  Readonly<{
    itemProgressHelpText: string;
    progressHelpText: string;
    repeatDisabled: boolean;
    completeDisabled: boolean;
    isInitialTrainingPractice: boolean;
    showProgressLabel: boolean;
    czechHidden: boolean;
  }>;

export type PracticeCardDisplayState = Readonly<{
  cardText: string | undefined;
  cardStyle: string;
  showGrammarButton: boolean;
  showNoteButton: boolean;
  pronunciationButtonDisabled: boolean;
  showProgressLabel: boolean;
  audioButtonDisabled: boolean;
  grammarButtonDisabled: boolean;
  noteButtonDisabled: boolean;
  controlsLocked: boolean;
  showHintControl: boolean;
  practiceControlColumns: string;
  showTopBar: boolean;
  showRevealHelp: boolean;
}>;
