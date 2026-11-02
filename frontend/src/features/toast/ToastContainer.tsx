import Toast from './Toast';
import { useToastStore } from './use-toast-store';
import type { JSX } from 'react';

/**
 * ToastContainer component that displays toast notifications from the toast store.
 *
 * @returns Persistent live regions and the visible toast, when one is active.
 */
export default function ToastContainer(): JSX.Element {
  const message = useToastStore((state) => state.message);
  const type = useToastStore((state) => state.type);
  const visible = useToastStore((state) => state.visible);

  return (
    <>
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {visible && type !== 'error' ? message : ''}
      </div>
      <div className="sr-only" role="alert" aria-live="assertive" aria-atomic="true">
        {visible && type === 'error' ? message : ''}
      </div>
      {visible && <Toast type={type} message={message} />}
    </>
  );
}
