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

async function playSoundExample(
  audio: string | undefined,
  playAudio: (audio: string) => Promise<boolean>,
  showToast: (message: string, type: 'error') => void,
): Promise<void> {
  if (!audio) return;
  if (!(await playAudio(audio))) showToast(TEXTS.noAudio, 'error');
}

type PronunciationSoundDetailCardProps = Readonly<{
  sounds: readonly GroupType[];
  audio?: string | null;
  index: number;
  onIndexChange: (index: number) => void;
  onClose: () => void;
}>;

export default function PronunciationSoundDetailCard({
  sounds,
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
          onClick={() => void playSoundExample(audio ?? undefined, playAudio, showToast)}
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
