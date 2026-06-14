import StarProgressOverview from '@/components/UI/StarProgress';
import config from '@/config/config';
import HelpText from '@/features/help/HelpText';
import type { JSX } from 'react';

type Props = {
  count: number;
  onClick?: () => void;
  ariaLabel?: string;
  helpText?: React.ReactNode;
  className?: string;
};

export default function PracticeOverviewButton({
  count,
  onClick,
  ariaLabel,
  helpText,
  className = '',
}: Readonly<Props>): JSX.Element {
  return (
    <div className={`px-4 ${className}`}>
      <div className="flex justify-center pt-2" title={ariaLabel}>
        <button
          type="button"
          className="home-star-button relative mb-2 inline-flex cursor-pointer items-center justify-center pt-1 text-center hover:border-current focus:outline-none"
          aria-label={ariaLabel}
          onClick={onClick}
        >
          <StarProgressOverview
            count={count}
            chunkSize={config.practice.starChunk}
            starsPerRow={config.practice.starsPerRow}
          />
          <HelpText className="-top-4 whitespace-nowrap">{helpText}</HelpText>
        </button>
      </div>
    </div>
  );
}
