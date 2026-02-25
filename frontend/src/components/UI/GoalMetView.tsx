interface GoalMetViewProps {
  count: number;
  goal: number;
}

export default function GoalMetView({ count, goal }: GoalMetViewProps) {
  const met = count >= goal;
  return (
    <p
      className={
        (met
          ? 'text-success-light dark:text-success-dark'
          : 'text-error-light dark:text-error-dark') + ' font-bold'
      }
    >
      {count} / {goal}
    </p>
  );
}
