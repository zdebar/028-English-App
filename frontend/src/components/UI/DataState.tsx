import type { ReactNode } from 'react';
import { TEXTS } from '@/locales/cs';
import DelayedNotification from './DelayedNotification';
import Notification from './Notification';

type DataStateProps = Readonly<{
  loading: boolean;
  hasData: boolean;
  noDataMessage?: string;
  children: ReactNode;
}>;

export function DataState({
  loading,
  hasData,
  noDataMessage = TEXTS.notAvailable,
  children,
}: DataStateProps) {
  if (hasData) return <>{children}</>;
  if (loading) {
    return <DelayedNotification />;
  }

  return <Notification className="pt-4">{noDataMessage}</Notification>;
}
