import type { JSX } from 'react/jsx-dev-runtime';

type GoalMetViewProps = Readonly<{
  current: number;
  goal: number;
}> &
  React.HTMLAttributes<HTMLParagraphElement>;

/**
 * Displays the current progress toward a goal with color coding.
 *
 * @param current - The current progress value
 * @param goal - The target goal value
 * @returns A paragraph element showing "current / goal" with success styling if goal is met, error styling otherwise
 */
export default function GoalMetView({ current, goal, ...rest }: GoalMetViewProps): JSX.Element {
  const met = current >= goal;
  return (
    <p
      title={rest.title}
      className={
        (met
          ? 'text-success-light dark:text-success-dark'
          : 'text-error-light dark:text-error-dark') + ' font-bold'
      }
      {...rest}
    >
      {current} / {goal}
    </p>
  );
}
