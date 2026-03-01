interface GoalMetViewProps {
  current: number;
  goal: number;
}

/**
 * Displays the current progress toward a goal with color coding.
 *
 * @param current - The current progress value
 * @param goal - The target goal value
 * @returns A paragraph element showing "current / goal" with success styling if goal is met, error styling otherwise
 */
export default function GoalMetView({ current, goal }: GoalMetViewProps) {
  const met = current >= goal;
  return (
    <p
      className={
        (met
          ? 'text-success-light dark:text-success-dark'
          : 'text-error-light dark:text-error-dark') + ' font-bold'
      }
    >
      {current} / {goal}
    </p>
  );
}
