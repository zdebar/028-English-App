import config from '@/config/config';
import type { ReadyPracticeScheduleEntry } from '@/types/generic.types';

/**
 * Groups ready-practice due dates into display buckets.
 *
 * @param dates ISO date strings or other Date.parse-compatible values. Invalid dates are ignored.
 * @returns Chronological groups where entries within the configured grouping window are counted
 * together and represented by the latest date in that group.
 */
export function groupReadyPracticeSchedule(dates: string[]): ReadyPracticeScheduleEntry[] {
  const sortedDates = dates
    .map((date) => ({ date, time: Date.parse(date) }))
    .filter((entry) => Number.isFinite(entry.time))
    .sort((left, right) => left.time - right.time);

  const schedule: ReadyPracticeScheduleEntry[] = [];
  let currentGroup: ReadyPracticeScheduleEntry | null = null;
  let currentGroupStartTime: number | null = null;

  for (const entry of sortedDates) {
    if (currentGroup == null || currentGroupStartTime == null) {
      currentGroup = { date: entry.date, count: 1 };
      currentGroupStartTime = entry.time;
      schedule.push(currentGroup);
      continue;
    }

    if (entry.time - currentGroupStartTime <= config.practice.readyPracticeScheduleGroupWindowMs) {
      currentGroup.date = entry.date;
      currentGroup.count += 1;
      continue;
    }

    currentGroup = { date: entry.date, count: 1 };
    currentGroupStartTime = entry.time;
    schedule.push(currentGroup);
  }

  return schedule;
}
