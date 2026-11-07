import type { DataPackageRequest, DataPackageValue } from './data-types';
import { useDataPackage } from './data-store';

export type CurrentUserDataPackageResult<Value> = Readonly<{
  data: Value | undefined;
  ready: boolean;
  loading: boolean;
  error: Error | null;
}>;

/** Exposes package data and status only while it belongs to the active user. */
export function useCurrentUserDataPackage<Request extends DataPackageRequest>(
  userId: string | null,
  request: Request,
): CurrentUserDataPackageResult<DataPackageValue<Request>> {
  const packageState = useDataPackage(request);
  const isCurrentUser = Boolean(userId) && packageState.userId === userId;
  const ready = isCurrentUser && packageState.status === 'ready';

  return {
    data: ready ? packageState.data : undefined,
    ready,
    loading: Boolean(userId) && (!isCurrentUser || packageState.status === 'loading'),
    error: isCurrentUser && packageState.status === 'error' ? packageState.error : null,
  };
}
