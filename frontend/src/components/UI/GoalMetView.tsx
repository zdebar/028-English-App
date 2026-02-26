interface GoalMetViewProps {
  current: number;
  goal: number;
}

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
