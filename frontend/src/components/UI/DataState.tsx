import { TEXTS } from '@/locales/cs';
import DelayedMessage from './DelayedMessage';
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
    return <DelayedMessage />;
  }

  return <Notification className="pt-4">{noDataMessage}</Notification>;
}
