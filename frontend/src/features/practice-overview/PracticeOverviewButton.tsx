import HelpText from '@/features/help/HelpText';
import type { JSX } from 'react';
import type { RouteDataDescriptor } from '@/routing/route-data-handoff';
import { useDataNavigation } from '@/routing/data-navigation';
import { formatProgressChange } from '@/utils/format.utils';

const BUTTON_CLASS_NAME =
  'relative mx-auto inline-flex w-full cursor-pointer items-center justify-center p-2 text-center underline-offset-4 hover:underline focus:outline-none';

type Props = {
  count: number;
  goal: number;
  onClick?: () => void;
  ariaLabel?: string;
  helpText?: React.ReactNode;
  className?: string;
  to?: string;
  descriptor?: RouteDataDescriptor<unknown>;
};

export default function PracticeOverviewButton({
  count,
  goal,
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
        goal={goal}
        ariaLabel={ariaLabel}
        helpText={helpText}
        className={className}
        to={to}
        descriptor={descriptor}
      />
    );
  }

  const decorationColorClass = getGoalDecorationColorClass(count, goal);

  return (
    <button
      type="button"
      className={`${BUTTON_CLASS_NAME} ${decorationColorClass} ${className}`}
      aria-label={ariaLabel}
      title={ariaLabel}
      onClick={onClick}
    >
      <DailyProgressValue value={count} goal={goal} />
      <HelpText className="-top-4 whitespace-nowrap">{helpText}</HelpText>
    </button>
  );
}

function DailyProgressValue({
  value,
  goal,
}: Readonly<{ value: number; goal: number }>): JSX.Element {
  const colorClass = getGoalTextColorClass(value, goal);

  return (
    <span className={`${colorClass} font-headings text-xl font-bold`}>
      {formatProgressChange(value)} / {goal}
    </span>
  );
}

function getGoalTextColorClass(value: number, goal: number): string {
  if (value >= goal) return 'text-success-light dark:text-success-dark';
  return 'text-error-light dark:text-error-dark';
}

function getGoalDecorationColorClass(value: number, goal: number): string {
  if (value >= goal) return 'decoration-success-light dark:decoration-success-dark';
  return 'decoration-error-light dark:decoration-error-dark';
}

function DataPracticeOverviewButton({
  count,
  goal,
  ariaLabel,
  helpText,
  className = '',
  to,
  descriptor,
}: Readonly<Props & { to: string }>): JSX.Element {
  const { pending, loadAndNavigate } = useDataNavigation(descriptor, to);
  const decorationColorClass = getGoalDecorationColorClass(count, goal);

  return (
    <button
      type="button"
      className={`${BUTTON_CLASS_NAME} ${decorationColorClass} ${className}`}
      aria-label={ariaLabel}
      title={ariaLabel}
      aria-busy={pending}
      disabled={pending}
      onClick={() => void loadAndNavigate()}
    >
      <DailyProgressValue value={count} goal={goal} />
      <HelpText className="-top-4 whitespace-nowrap">{helpText}</HelpText>
    </button>
  );
}
