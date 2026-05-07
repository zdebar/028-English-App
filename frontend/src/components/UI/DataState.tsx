import { TEXTS } from '@/locales/cs';
import DelayedNotification from './DelayedNotification';

type DataStateProps = Readonly<{
  loading: boolean;
  hasData: boolean;
  noDataMessage?: string;
  children: React.ReactNode;
}>;

export function DataState({
  loading,
  hasData,
  noDataMessage = TEXTS.notAvailable,
  children,
}: DataStateProps) {
  if (hasData) return <>{children}</>;
  if (!loading)
    return <DelayedNotification className="color-info pt-4">{noDataMessage}</DelayedNotification>;
  return null;
}
