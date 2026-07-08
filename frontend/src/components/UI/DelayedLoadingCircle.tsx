import config from '@/config/config';
import type { JSX } from 'react';
import Delayed from './Delayed';
import LoadingCircle from './LoadingCircle';

type DelayedLoadingCircleProps = Readonly<{
  timeDelay?: number;
  label?: string;
  className?: string;
}>;

/**
 * Shows a loading circle after the standard data-view delay.
 */
export default function DelayedLoadingCircle({
  timeDelay = config.loading.dataStateDelayMs,
  label,
  className,
}: DelayedLoadingCircleProps): JSX.Element {
  return (
    <Delayed timeDelay={timeDelay} className="w-full">
      <LoadingCircle label={label} className={className} />
    </Delayed>
  );
}
