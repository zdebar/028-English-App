import { STAR_SIZE, StarRow } from '@/components/UI/StarProgress';
import { type JSX } from 'react';

type PracticeStarsRowProps = Readonly<{
  starCount: number;
  displayedChunkCount: number;
  starChunk: number;
  starsPerRow: number;
  size?: number;
}>;

export default function PracticeStarsRow({
  starCount,
  displayedChunkCount,
  starChunk,
  starsPerRow,
  size = STAR_SIZE,
}: PracticeStarsRowProps): JSX.Element {
  return (
    <span className="inline-flex items-center gap-2 self-center whitespace-nowrap">
      <StarRow
        starCount={starCount}
        starsPerRow={starsPerRow}
        size={size}
      />
      <span className={`inline-block w-18 text-right tabular-nums`}>
        {displayedChunkCount} / {starChunk}
      </span>
    </span>
  );
}
