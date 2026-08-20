import StarProgressOverview from '@/components/UI/StarProgress';
import config from '@/config/config';
import HelpText from '@/features/help/HelpText';
import type { JSX } from 'react';
import type { RouteDataDescriptor } from '@/routing/route-data-handoff';
import { useDataNavigation } from '@/routing/data-navigation';

type Props = {
  count: number;
  onClick?: () => void;
  ariaLabel?: string;
  helpText?: React.ReactNode;
  className?: string;
  to?: string;
  descriptor?: RouteDataDescriptor<unknown>;
};

export default function PracticeOverviewButton({
  count,
  onClick,
  ariaLabel,
  helpText,
  className = '',
  to,
  descriptor,
}: Readonly<Props>): JSX.Element {
  if (to) {
    return (
      <DataPracticeOverviewButton
        count={count}
        ariaLabel={ariaLabel}
        helpText={helpText}
        className={className}
        to={to}
        descriptor={descriptor}
      />
    );
  }

  return (
    <button
      type="button"
      className={`home-star-button relative mx-auto inline-flex w-full cursor-pointer items-center justify-center p-2 text-center hover:border-current focus:outline-none ${className}`}
      aria-label={ariaLabel}
      title={ariaLabel}
      onClick={onClick}
    >
      <StarProgressOverview
        count={count}
        chunkSize={config.practice.starChunk}
        starsPerRow={config.practice.starsPerRow}
      />
      <HelpText className="-top-4 whitespace-nowrap">{helpText}</HelpText>
    </button>
  );
}

function DataPracticeOverviewButton({
  count,
  ariaLabel,
  helpText,
  className = '',
  to,
  descriptor,
}: Readonly<Props & { to: string }>): JSX.Element {
  const { pending, loadAndNavigate } = useDataNavigation(descriptor, to);
  return (
    <button
      type="button"
      className={`home-star-button relative mx-auto inline-flex w-full cursor-pointer items-center justify-center p-2 text-center hover:border-current focus:outline-none ${className}`}
      aria-label={ariaLabel}
      title={ariaLabel}
      aria-busy={pending}
      disabled={pending}
      onClick={() => void loadAndNavigate()}
    >
      <StarProgressOverview
        count={count}
        chunkSize={config.practice.starChunk}
        starsPerRow={config.practice.starsPerRow}
      />
      <HelpText className="-top-4 whitespace-nowrap">{helpText}</HelpText>
    </button>
  );
}
