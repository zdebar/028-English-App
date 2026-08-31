import HelpText from '@/features/help/HelpText';
import type { JSX } from 'react';
import type { RouteDataDescriptor } from '@/routing/route-data-handoff';
import { useDataNavigation } from '@/routing/data-navigation';
import { formatProgressChange } from '@/utils/format.utils';

const BUTTON_CLASS_NAME =
  'relative mx-auto inline-flex w-full cursor-pointer items-center justify-center p-2 text-center decoration-current underline-offset-4 hover:underline focus:outline-none';

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
      className={`${BUTTON_CLASS_NAME} ${className}`}
      aria-label={ariaLabel}
      title={ariaLabel}
      onClick={onClick}
    >
      <DailyProgressValue value={count} />
      <HelpText className="-top-4 whitespace-nowrap">{helpText}</HelpText>
    </button>
  );
}

function DailyProgressValue({ value }: Readonly<{ value: number }>): JSX.Element {
  return <span className="font-headings text-2xl font-bold">{formatProgressChange(value)}</span>;
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
      className={`${BUTTON_CLASS_NAME} ${className}`}
      aria-label={ariaLabel}
      title={ariaLabel}
      aria-busy={pending}
      disabled={pending}
      onClick={() => void loadAndNavigate()}
    >
      <DailyProgressValue value={count} />
      <HelpText className="-top-4 whitespace-nowrap">{helpText}</HelpText>
    </button>
  );
}
