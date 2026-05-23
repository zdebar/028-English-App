import OverviewCard from '@/components/UI/OverviewCard';
import { ROUTES } from '@/config/routes.config';
import UserScore from '@/database/models/user-scores';
import { useAuthStore } from '@/features/auth/use-auth-store';
import { TEXTS } from '@/locales/cs';
import type { UserScoreType } from '@/types/generic.types';
import { CompactSummary, STAR_SIZE } from '@/components/UI/StarProgress';
import config from '@/config/config';
import { getStarProgressState } from '@/utils/star-progress.utils';
import { useEffect, useState, type JSX } from 'react';
import { useNavigate } from 'react-router-dom';

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

function PracticeOverviewRow({ score }: Readonly<{ score: UserScoreType }>): JSX.Element {
  const progress = getStarProgressState(
    score.item_count,
    config.practice.starChunk,
    config.practice.starsPerRow,
  );

  return (
    <div
      className={`flex items-center justify-between gap-4 px-4 pt-3 pb-1 dark:border-slate-700 ${
        isSunday(score.date)
          ? 'border-b-4 border-double border-slate-300 dark:border-slate-500'
          : 'border-b border-slate-200 dark:border-slate-700'
      }`}
    >
      <span
        className={`inline-flex min-h-7 items-center ${isSunday(score.date) ? 'font-bold' : ''}`}
      >
        {formatPracticeDate(score.date)}
      </span>
      <div className="mr-4 flex items-center gap-2">
        <CompactSummary
          fullTierCount={progress.completedTiers}
          partialTierCount={progress.activeRowCompletedStars}
          partialTier={progress.activeTier}
          starsPerRow={config.practice.starsPerRow}
          size={STAR_SIZE}
        />
      </div>
    </div>
  );
}

export default function PracticeOverview(): JSX.Element {
  const navigate = useNavigate();
  const userId = useAuthStore((state) => state.userId);
  const [scores, setScores] = useState<UserScoreType[]>([]);
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_DAYS);

  useEffect(() => {
    if (!userId) {
      setScores([]);
      setVisibleCount(INITIAL_VISIBLE_DAYS);
      return;
    }

    let isMounted = true;
    void UserScore.getByUserId(userId).then((items) => {
      if (isMounted) {
        setScores(items);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [userId]);

  const visibleScores = scores.slice(0, visibleCount);
  const hasMoreScores = scores.length > visibleCount;

  return (
    <OverviewCard buttonTitle={TEXTS.practiceOverviewTitle} onClose={() => navigate(ROUTES.home)}>
      <div className="flex flex-col pb-4">
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
      </div>
    </OverviewCard>
  );
}
