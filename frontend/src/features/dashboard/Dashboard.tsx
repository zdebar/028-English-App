import { TEXTS } from '@/locales/cs';
import Blockbar from '@/features/dashboard/BlockBar';
import { useUserStore } from './use-user-store';
import HelpButton from '@/features/help/HelpButton';
import HelpText from '@/features/help/HelpText';

type DashboardProps = {
  className?: string;
};

/**
 * Dashboard component displaying the user's lesson progress and helpful UI elements.
 *
 * @param className Additional CSS classes for custom styling.
 * @returns The dashboard view with lesson progress, hints, and help overlay.
 */
export default function Dashboard({ className = '' }: DashboardProps) {
  const levelsOverview = useUserStore((state) => state.userStats?.levelsOverview);

  /* Shows all lessons that:
   *  have items started today, or
   *  have some items started but not all, or
   *  is the first lesson with zero items started
   */
  const allLessons = levelsOverview ? levelsOverview.flatMap((level) => level.lessons) : [];
  const nextZeroStartedLessonId = allLessons
    .filter((lesson) => lesson.startedCount === 0)
    .reduce<
      number | null
    >((minLessonId, lesson) => (minLessonId === null || lesson.lesson_id! < minLessonId ? lesson.lesson_id! : minLessonId), null);
  const lessons = allLessons.filter(
    (lesson) =>
      lesson.startedTodayCount > 0 ||
      (lesson.startedCount > 0 && lesson.startedCount !== lesson.totalCount) ||
      (nextZeroStartedLessonId != null && lesson.lesson_id === nextZeroStartedLessonId),
  );

  const maxTotalCount = Math.max(...lessons.map((lesson) => lesson.totalCount), 1);

  return (
    <div className={`min-w-card relative mx-auto flex w-full flex-col gap-1 ${className}`}>
      {lessons?.map(
        ({ lesson_id, lesson_name, level_name, startedCount, startedTodayCount, totalCount }) => (
          <Blockbar
            key={lesson_id}
            lessonName={lesson_name!}
            levelName={level_name!}
            previousCount={startedCount - startedTodayCount}
            todayCount={startedTodayCount}
            lessonCount={totalCount}
            maxCount={maxTotalCount}
          />
        ),
      )}
      <HelpButton className="-bottom-11 left-0" />
      <HelpText className="right-3.5 -bottom-11">{TEXTS.startedTodayHint}</HelpText>
    </div>
  );
}
