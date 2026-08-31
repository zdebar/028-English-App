import OverviewCard from '@/components/UI/OverviewCard';
import { ROUTES } from '@/config/routes.config';
import UserItemProgressHistory from '@/database/models/user-item-progress-history';
import { useAuthStore } from '@/features/auth/use-auth-store';
import { TEXTS } from '@/locales/cs';
import type { UserItemProgressHistoryType } from '@/types/user-item.types';
import { useCallback, useEffect, useMemo, useState, type JSX } from 'react';
import { DataState } from '@/components/UI/DataState';
import { useToastStore } from '@/features/toast/use-toast-store';
import { reportError } from '@/features/logging/monitoring-handler';
import { useLiveQueryData } from '@/hooks/use-live-query-data';
import { useRouteClose } from '@/routing/use-route-close';

const INITIAL_VISIBLE_DAYS = 7;

type PracticeDay = Readonly<{
  date: string;
  score: number;
  entries: UserItemProgressHistoryType[];
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

function formatSignedNumber(value: number): string {
  if (value > 0) return `+${value}`;
  return String(value);
}

function getPracticeDays(history: UserItemProgressHistoryType[]): PracticeDay[] {
  if (history.length === 0) return [];

  const grouped = new Map<string, UserItemProgressHistoryType[]>();
  history.forEach((entry) => {
    const entries = grouped.get(entry.date) ?? [];
    entries.push(entry);
    grouped.set(entry.date, entries);
  });

  const sortedDates = [...grouped.keys()].sort((left, right) => right.localeCompare(left));
  const newestDate = parseShortDate(sortedDates[0]);
  const oldestDate = parseShortDate(sortedDates.at(-1) ?? sortedDates[0]);
  const today = new Date();
  const endDate = newestDate > today ? newestDate : today;
  const days: PracticeDay[] = [];

  for (let cursor = new Date(endDate); cursor >= oldestDate; cursor.setDate(cursor.getDate() - 1)) {
    const date = formatShortDate(cursor);
    const entries = grouped.get(date) ?? [];
    const sortedEntries = [...entries];
    sortedEntries.sort(
      (left, right) =>
        left.item_id - right.item_id || left.direction.localeCompare(right.direction),
    );
    days.push({
      date,
      score: entries.reduce((total, entry) => total + entry.progress_change, 0),
      entries: sortedEntries,
    });
  }
  return days;
}

function PracticeOverviewEntry({
  entry,
}: Readonly<{ entry: UserItemProgressHistoryType }>): JSX.Element {
  const direction =
    entry.direction === 'czToEn' ? TEXTS.directionCzToEnShort : TEXTS.directionEnToCzShort;
  return (
    <div className="flex items-center justify-between gap-2 px-8 py-1 text-sm">
      <span>
        {entry.item_id} · {direction}
      </span>
      <span>
        {entry.progress} / {entry.max_progress}
      </span>
    </div>
  );
}

function PracticeOverviewRow({
  day,
  expanded,
  onToggle,
}: Readonly<{ day: PracticeDay; expanded: boolean; onToggle: () => void }>): JSX.Element {
  return (
    <div className={isSunday(day.date) ? 'border-t-2 border-b' : 'border-b'}>
      <button
        type="button"
        className="h-button flex w-full items-center justify-between gap-4 px-4"
        aria-expanded={expanded}
        onClick={onToggle}
      >
        <span
          className={`my-auto inline-flex min-h-7 items-center ${isSunday(day.date) ? 'font-bold' : ''}`}
        >
          {formatPracticeDate(day.date)}
        </span>
        <span className="mr-4 font-bold">{formatSignedNumber(day.score)}</span>
      </button>
      {expanded &&
        day.entries.map((entry) => (
          <PracticeOverviewEntry key={`${entry.item_id}-${entry.direction}`} entry={entry} />
        ))}
    </div>
  );
}

export default function PracticeOverviewFeature({
  initialHistory,
}: Readonly<{ initialHistory?: UserItemProgressHistoryType[] }>): JSX.Element {
  const closeRoute = useRouteClose(ROUTES.home);
  const userId = useAuthStore((state) => state.userId);
  const showToast = useToastStore((state) => state.showToast);
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_DAYS);
  const [expandedDate, setExpandedDate] = useState<string | null>(null);
  const fetchHistory = useCallback(
    () => (userId ? UserItemProgressHistory.getByUserId(userId) : Promise.resolve([])),
    [userId],
  );
  const {
    data: rawHistory,
    loading,
    error,
  } = useLiveQueryData(fetchHistory, {
    emptyData: [],
    initialData: initialHistory,
  });
  const days = useMemo(() => getPracticeDays(rawHistory), [rawHistory]);

  useEffect(() => {
    setVisibleCount(INITIAL_VISIBLE_DAYS);
    setExpandedDate(null);
  }, [userId]);

  useEffect(() => {
    if (!error) return;
    showToast(TEXTS.loadingError, 'error');
    reportError('Failed to observe practice overview', error);
  }, [error, showToast]);

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
            <PracticeOverviewRow
              key={day.date}
              day={day}
              expanded={expandedDate === day.date}
              onToggle={() =>
                setExpandedDate((current) => (current === day.date ? null : day.date))
              }
            />
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
