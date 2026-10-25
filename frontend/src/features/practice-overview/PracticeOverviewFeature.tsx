import { getOverviewQuery, overviewQueryKey } from '@/hooks/overview-query-store';
import OverviewCard from '@/components/UI/OverviewCard';
import { ROUTES } from '@/config/routes.config';
import { getLocalDateFromUTC } from '@/database/utils/database.utils';
import { useAuthStore } from '@/features/auth/use-auth-store';
import { useQueryErrorToast } from '@/features/logging/use-query-error-toast';
import { TEXTS } from '@/locales/cs';
import type { UserLessonType } from '@/types/generic.types';
import { useCallback, useEffect, useMemo, useState, type JSX } from 'react';
import { DataState } from '@/components/UI/DataState';
import { useLiveQueryData } from '@/hooks/use-live-query-data';
import { useRouteClose } from '@/routing/use-route-close';

const INITIAL_VISIBLE_DAYS = 7;

type PracticeDay = Readonly<{
  date: string;
  startedCount: number;
}>;

function formatPracticeDate(date: string): string {
  const [year, month, day] = date.split('-').map(Number);
  const parsedDate = new Date(year, (month ?? 1) - 1, day ?? 1);
  return new Intl.DateTimeFormat('cs-CZ', { day: '2-digit', month: '2-digit' }).format(parsedDate);
}

function isSunday(date: string): boolean {
  const [year, month, day] = date.split('-').map(Number);
  return new Date(year, (month ?? 1) - 1, day ?? 1).getDay() === 0;
}

function parseShortDate(date: string): Date {
  const [year, month, day] = date.split('-').map(Number);
  return new Date(year ?? 1970, (month ?? 1) - 1, day ?? 1);
}

function formatShortDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getPracticeDays(userLessons: UserLessonType[]): PracticeDay[] {
  const startedCountByDate = new Map<string, number>();
  const lessonsByDate = new Map<string, Set<number>>();
  userLessons.forEach((userLesson) => {
    const date = getLocalDateFromUTC(userLesson.started_at);
    const lessons = lessonsByDate.get(date) ?? new Set<number>();
    lessons.add(userLesson.lesson_id);
    lessonsByDate.set(date, lessons);
  });
  lessonsByDate.forEach((lessons, date) => {
    startedCountByDate.set(date, lessons.size);
  });

  const sortedDates = [...startedCountByDate.keys()].sort((left, right) =>
    right.localeCompare(left),
  );
  if (sortedDates.length === 0) return [];

  const newestDate = parseShortDate(sortedDates[0] ?? '');
  const oldestDate = parseShortDate(sortedDates.at(-1) ?? '');
  const today = new Date();
  const endDate = newestDate > today ? newestDate : today;
  const days: PracticeDay[] = [];

  for (let cursor = new Date(endDate); cursor >= oldestDate; cursor.setDate(cursor.getDate() - 1)) {
    const date = formatShortDate(cursor);
    days.push({ date, startedCount: startedCountByDate.get(date) ?? 0 });
  }
  return days;
}

function PracticeOverviewRow({ day }: Readonly<{ day: PracticeDay }>): JSX.Element {
  return (
    <div className={isSunday(day.date) ? 'border-t-2 border-b' : 'border-b'}>
      <div className="h-button flex items-center justify-between gap-4 px-4">
        <span
          className={`my-auto inline-flex min-h-7 items-center ${isSunday(day.date) ? 'font-bold' : ''}`}
        >
          {formatPracticeDate(day.date)}
        </span>
        <span className="mr-4 font-bold">{day.startedCount}</span>
      </div>
    </div>
  );
}

export default function PracticeOverviewFeature({
  initialUserLessons,
}: Readonly<{ initialUserLessons?: UserLessonType[] }>): JSX.Element {
  const closeRoute = useRouteClose(ROUTES.home);
  const userId = useAuthStore((state) => state.userId);
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_DAYS);
  const fetchUserLessons = useCallback(
    () => (userId ? getOverviewQuery(userId, 'practice-overview')() : Promise.resolve([])),
    [userId],
  );
  const { data: userLessons, loading, error } = useLiveQueryData(fetchUserLessons, {
    emptyData: [],
    initialData: initialUserLessons,
    sharedKey: userId ? overviewQueryKey(userId, 'practice-overview') : undefined,
  });
  const days = useMemo(() => getPracticeDays(userLessons), [userLessons]);

  useEffect(() => {
    setVisibleCount(INITIAL_VISIBLE_DAYS);
  }, [userId]);

  useQueryErrorToast(error, 'Failed to observe practice overview');

  const visibleDays = days.slice(0, visibleCount);
  const hasMoreDays = days.length > visibleCount;

  return (
    <OverviewCard buttonTitle={TEXTS.practiceOverviewTitle} onClose={closeRoute}>
      <div className="flex flex-col pt-1">
        <DataState
          loading={loading}
          hasData={days.length > 0}
          noDataMessage={TEXTS.practiceOverviewNone}
        >
          {visibleDays.map((day) => (
            <PracticeOverviewRow key={day.date} day={day} />
          ))}
          {hasMoreDays && (
            <button
              type="button"
              onClick={() => setVisibleCount((prev) => prev + INITIAL_VISIBLE_DAYS)}
              className="mt-2 w-full text-center font-bold hover:underline"
            >
              {TEXTS.practiceOverviewMoreDays}
            </button>
          )}
        </DataState>
      </div>
    </OverviewCard>
  );
}
