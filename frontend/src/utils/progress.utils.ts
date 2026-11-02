import config from '@/config/config';

const SRS_LENGTH = config.srs.intervals.length;

export function formatProgress(progress: number | null | undefined): string | undefined {
  if (progress == null) return undefined;
  return `${progress} / ${SRS_LENGTH}`;
}
