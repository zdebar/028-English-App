import OverviewCard from '@/components/UI/OverviewCard';
import SecondaryControlButton from '@/components/UI/buttons/SecondaryControlButton';
import RightArrowIcon from '@/components/UI/icons/RightArrowIcon';
import type { GroupType } from '@/types/table.types';
import { TEXTS } from '@/locales/cs';

type PronunciationSoundDetailCardProps = Readonly<{
  sounds: readonly GroupType[];
  index: number;
  onIndexChange: (index: number) => void;
  onClose: () => void;
}>;

export default function PronunciationSoundDetailCard({
  sounds,
  index,
  onIndexChange,
  onClose,
}: PronunciationSoundDetailCardProps) {
  const sound = sounds[index];
  if (!sound) return null;

  const isFirstSound = index === 0;
  const isLastSound = index === sounds.length - 1;

  return (
    <OverviewCard
      buttonTitle={sound.name}
      onClose={onClose}
      showResetAction={false}
      className="bottom-controls-clearance relative"
    >
      <div className="px-4 pt-4">
        {sound.note && <p className="whitespace-pre-line">{sound.note}</p>}
        <p className="mt-3 text-center text-sm" aria-live="polite">
          {index + 1} / {sounds.length}
        </p>
      </div>
      <div className="pos-bottom-left-control">
        <SecondaryControlButton
          title={TEXTS.previousSound}
          ariaLabel={TEXTS.previousSound}
          onClick={() => onIndexChange(index - 1)}
          disabled={isFirstSound}
        >
          <RightArrowIcon className="rotate-180" />
        </SecondaryControlButton>
      </div>
      <div className="pos-bottom-right-control">
        <SecondaryControlButton
          title={TEXTS.nextSound}
          ariaLabel={TEXTS.nextSound}
          onClick={() => onIndexChange(index + 1)}
          disabled={isLastSound}
        >
          <RightArrowIcon />
        </SecondaryControlButton>
      </div>
    </OverviewCard>
  );
}
