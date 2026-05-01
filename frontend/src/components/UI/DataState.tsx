import Notification from './Notification';
import DelayedNotification from './DelayedNotification';
import { TEXTS } from '@/locales/cs';

type DataStateProps = {
  loading: boolean;
  error: boolean;
  hasData: boolean;
  noDataMessage?: string;
  children: React.ReactNode;
};

export function DataState({ loading, error, hasData, noDataMessage, children }: DataStateProps) {
  if (loading) return <DelayedNotification>{TEXTS.loadingMessage}</DelayedNotification>;
  if (error) return <Notification className="color-error pt-4">{TEXTS.loadingError}</Notification>;
  if (hasData) return <>{children}</>;
  return <Notification className="color-info pt-4">{noDataMessage}</Notification>;
}
