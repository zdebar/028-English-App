import { useCallback, useEffect, useRef } from 'react';
import ForwardIcon from '@/components/UI/icons/ForwardIcon';

import { useToastStore } from '@/features/toast/use-toast-store';
import { TEXTS } from '@/locales/cs';
import config from '@/config/config';
import PracticeButton from './PracticeButton';

type MasterItemButtonProps = Readonly<{
  onConfirm: () => void | Promise<void>;
  disabled: boolean;
  children?: React.ReactNode;
}>;

const HOLD_DURATION_MS = config.practice.holdDuration;

export default function MasterItemButton({ onConfirm, disabled, children }: MasterItemButtonProps) {
  const showToast = useToastStore((state) => state.showToast);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressTriggeredRef = useRef(false);

  const clearHoldTimer = useCallback(() => {
    if (timeoutRef.current !== null) {
      globalThis.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const handlePressStart = useCallback(() => {
    if (disabled) {
      return;
    }

    longPressTriggeredRef.current = false;
    clearHoldTimer();

    timeoutRef.current = globalThis.setTimeout(() => {
      longPressTriggeredRef.current = true;
      void (async () => {
        try {
          await onConfirm();
          showToast(TEXTS.skipSuccessToast, 'success');
        } catch {
          showToast(TEXTS.skipErrorToast, 'error');
        }
      })();
    }, HOLD_DURATION_MS);
  }, [clearHoldTimer, disabled, onConfirm, showToast]);

  const handlePressEnd = useCallback(() => {
    clearHoldTimer();
  }, [clearHoldTimer]);

  const handleClick = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();

      if (disabled) {
        return;
      }

      if (longPressTriggeredRef.current) {
        longPressTriggeredRef.current = false;
        return;
      }

      showToast(TEXTS.skipHoldInfoToast, 'info');
    },
    [disabled, showToast],
  );

  useEffect(() => {
    return () => {
      clearHoldTimer();
    };
  }, [clearHoldTimer]);

  return (
    <PracticeButton
      icon={<ForwardIcon />}
      label={TEXTS.complete}
      className="pos-help-bottom-left"
      onPointerDown={handlePressStart}
      onPointerUp={handlePressEnd}
      onPointerLeave={handlePressEnd}
      onPointerCancel={handlePressEnd}
      onClick={handleClick}
      disabled={disabled}
    >
      {children}
    </PracticeButton>
  );
}
