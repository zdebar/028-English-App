import OverviewCard from '@/components/UI/OverviewCard';
import { ROUTES } from '@/config/routes.config';
import UserScore from '@/database/models/user-scores';
import { useAuthStore } from '@/features/auth/use-auth-store';
import { TEXTS } from '@/locales/cs';
import type { UserScoreType } from '@/types/generic.types';
import { STAR_SIZE, StarRow } from '@/components/UI/StarProgress';
import config from '@/config/config';
import { useCallback, useEffect, useMemo, useState, type JSX } from 'react';
import { DataState } from '@/components/UI/DataState';
import { useToastStore } from '@/features/toast/use-toast-store';
import { reportError } from '@/features/logging/monitoring-handler';
import { useLiveQueryData } from '@/hooks/use-live-query-data';
import { useRouteClose } from '@/routing/use-route-close';

const INITIAL_VISIBLE_DAYS = 7;

function formatPracticeDate(date: string): string {
  const [year, month, day] = date.split('-').map(Number);
  const parsedDate = new Date(year, (month ?? 1) - 1, day ?? 1);

  return new Intl.DateTimeFormat('cs-CZ', {
    day: '2-digit',
    month: '2-digit',
  }).format(parsedDate);
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

type PracticeDayScore = Readonly<Pick<UserScoreType, 'date' | 'star_count'>>;

function getScoresWithMissingDays(scores: UserScoreType[]): PracticeDayScore[] {
  if (scores.length === 0) {
    return [];
  }

  const sortedDesc = [...scores].sort((left, right) => right.date.localeCompare(left.date));
  const scoreByDate = new Map(sortedDesc.map((item) => [item.date, item.star_count]));
  const newestDate = parseShortDate(sortedDesc[0].date);
  const oldestDate = parseShortDate(sortedDesc.at(-1)?.date ?? '');
  const today = new Date();
  const endDate = newestDate > today ? newestDate : today;
  const items: PracticeDayScore[] = [];

  for (let cursor = new Date(endDate); cursor >= oldestDate; cursor.setDate(cursor.getDate() - 1)) {
    const date = formatShortDate(cursor);
    items.push({
      date,
      star_count: scoreByDate.get(date) ?? 0,
    });
  }

  return items;
}

function PracticeOverviewRow({ score }: Readonly<{ score: PracticeDayScore }>): JSX.Element {
  return (
    <div
      className={`h-button flex items-center justify-between gap-4 border-white px-4 dark:border-slate-700 ${
        isSunday(score.date) ? 'border-t-2 border-b' : 'border-b'
      }`}
    >
      <span
        className={`my-auto inline-flex min-h-7 items-center ${isSunday(score.date) ? 'font-bold' : ''}`}
      >
        {formatPracticeDate(score.date)}
      </span>
      <div className="mr-4 flex items-center gap-2">
        <StarRow
          starCount={score.star_count}
          starsPerRow={config.practice.starsPerRow}
          size={STAR_SIZE}
        />
      </div>
    </div>
  );
}

export default function PracticeOverviewFeature({
  initialScores,
}: Readonly<{ initialScores?: UserScoreType[] }>): JSX.Element {
  const closeRoute = useRouteClose(ROUTES.home);
  const userId = useAuthStore((state) => state.userId);
  const showToast = useToastStore((state) => state.showToast);
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_DAYS);
  const fetchScores = useCallback(
    () => (userId ? UserScore.getByUserId(userId) : Promise.resolve([])),
    [userId],
  );
  const { data: rawScores, loading, error } = useLiveQueryData(fetchScores, {
    emptyData: [],
    initialData: initialScores,
  });
  const scores = useMemo(() => getScoresWithMissingDays(rawScores), [rawScores]);

  useEffect(() => {
    setVisibleCount(INITIAL_VISIBLE_DAYS);
  }, [userId]);

  useEffect(() => {
    if (!error) return;
    showToast(TEXTS.loadingError, 'error');
    reportError('Failed to observe practice overview', error);
  }, [error, showToast]);

  const visibleScores = scores.slice(0, visibleCount);
  const hasMoreScores = scores.length > visibleCount;

  return (
    <OverviewCard buttonTitle={TEXTS.practiceOverviewTitle} onClose={closeRoute}>
      <div className="flex flex-col pt-1">
        <DataState
          loading={loading}
          hasData={scores.length > 0}
          noDataMessage={TEXTS.practiceOverviewNone}
        >
          {visibleScores.map((score) => (
            <PracticeOverviewRow key={score.date} score={score} />
          ))}
          {hasMoreScores && (
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
