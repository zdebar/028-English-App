import config from '@/config/config';
import type { ReadyPracticeScheduleEntry } from '@/types/generic.types';

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
