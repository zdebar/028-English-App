import Card from '@/components/UI/Card';
import CloseButton from '@/components/UI/buttons/CloseButton';
import StyledButton from '@/components/UI/buttons/StyledButton';
import ChevronRightIcon from '@/components/UI/icons/ChevronRightIcon';
import type { GroupType } from '@/types/table.types';
import { TEXTS } from '@/locales/cs';
import { useAudioManager } from '@/features/audio/use-audio-manager';
import PlayButton from '@/features/audio/PlayButton';
import VolumeSlider from '@/features/audio/VolumeSlider';
import { useToastStore } from '@/features/toast/use-toast-store';
import { playAudioWithToast } from '@/features/audio/audio.utils';

type PronunciationSoundDetailCardProps = Readonly<{
  sounds: readonly GroupType[];
  pronunciationSounds: readonly GroupType[];
  audio?: string | null;
  index: number;
  onIndexChange: (index: number) => void;
  onClose: () => void;
}>;

export default function PronunciationSoundDetailCard({
  sounds,
  pronunciationSounds,
  audio = null,
  index,
  onIndexChange,
  onClose,
}: PronunciationSoundDetailCardProps) {
  const sound = sounds[index];
  const showToast = useToastStore((state) => state.showToast);
  const { playAudio, isAudioReady, loading: audioLoading, audioError } = useAudioManager(audio);
  const audioDisabled = !audio || audioLoading || audioError || !isAudioReady(audio);
  if (!sound) return null;

  const isFirstSound = index === 0;
  const isLastSound = index === sounds.length - 1;
  const highlightedPronunciation = highlightSoundOccurrences(pronunciationSounds, sound);
  const pronunciationText = pronunciationSounds.map((item) => item.name).join('');
  return (
    <Card className="card-height gap-1">
      <div className="h-button flex w-full shrink-0 items-center gap-1">
        <StyledButton
          className="h-button preserve-disabled-text-color grow justify-center px-4 text-center"
          aria-label={`IPA ${sound.name}`}
          disabled
        >
          {sound.name}
        </StyledButton>
        <CloseButton onClick={onClose} />
      </div>
      <div className="flex min-h-0 grow items-start overflow-auto p-4 text-left">
        {sound.note && <p className="font-normal whitespace-pre-line">{sound.note}</p>}
      </div>
      <div className="pos-bottom-left-control">
        <PlayButton
          onClick={() => void playAudioWithToast(audio, playAudio, showToast)}
          disabled={audioDisabled}
        />
        <VolumeSlider />
      </div>
      <div
        data-testid="pronunciation-sound-navigation"
        className="flex w-full shrink-0 items-center justify-center gap-1"
      >
        <StyledButton
          className="h-button min-h-button w-button min-w-0 shrink-0 grow-0 p-0"
          title={TEXTS.previousSound}
          aria-label={TEXTS.previousSound}
          onClick={() => onIndexChange(index - 1)}
          disabled={isFirstSound}
        >
          <ChevronRightIcon className="rotate-180" />
        </StyledButton>
        <StyledButton
          className="h-button preserve-disabled-text-color min-h-button min-w-0 grow justify-center gap-0 px-2"
          aria-label={pronunciationText}
          aria-live="polite"
          disabled
        >
          {highlightedPronunciation.map((segment, segmentIndex) => (
            <span
              key={`${segment.name}-${segmentIndex}`}
              className={segment.isHighlighted ? 'text-blue-600 dark:text-blue-400' : undefined}
            >
              {segment.name}
            </span>
          ))}
        </StyledButton>
        <StyledButton
          className="h-button min-h-button w-button min-w-0 shrink-0 grow-0 p-0"
          title={TEXTS.nextSound}
          aria-label={TEXTS.nextSound}
          onClick={() => onIndexChange(index + 1)}
          disabled={isLastSound}
        >
          <ChevronRightIcon />
        </StyledButton>
      </div>
    </Card>
  );
}

type PronunciationSegment = Readonly<{ name: string; isHighlighted: boolean }>;

function highlightSoundOccurrences(
  pronunciationSounds: readonly GroupType[],
  highlightedSound: GroupType,
): readonly PronunciationSegment[] {
  return pronunciationSounds.map((sound) => ({
    name: sound.name,
    isHighlighted: sound.id === highlightedSound.id,
  }));
}
