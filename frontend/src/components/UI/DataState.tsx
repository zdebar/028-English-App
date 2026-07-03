import { TEXTS } from '@/locales/cs';
import config from '@/config/config';
import Delayed from './Delayed';
import LoadingCircle from './LoadingCircle';
import Notification from './Notification';

type DataStateProps = Readonly<{
  loading: boolean;
  hasData: boolean;
  noDataMessage?: string;
  children?: React.ReactNode;
}>;

export function DataState({
  loading,
  hasData,
  noDataMessage = TEXTS.notAvailable,
  children,
}: DataStateProps) {
  if (hasData) return <>{children}</>;
  if (loading) {
    return (
      <Delayed timeDelay={config.loading.dataStateDelayMs} className="w-full">
        <LoadingCircle />
      </Delayed>
    );
  }

  return <Notification className="color-info pt-4">{noDataMessage}</Notification>;
}
