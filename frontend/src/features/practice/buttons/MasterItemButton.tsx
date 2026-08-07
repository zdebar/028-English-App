import { useCallback, useEffect, useRef } from 'react';
import ForwardIcon from '@/components/UI/icons/ForwardIcon';

import { useToastStore } from '@/features/toast/use-toast-store';
import { TEXTS } from '@/locales/cs';
import config from '@/config/config';
import ControlButton from './ControlButton';

type MasterItemButtonProps = Readonly<{
  onConfirm: () => void | Promise<void>;
  disabled: boolean;
  children?: React.ReactNode;
}>;

const HOLD_DURATION_MS = config.practice.holdDuration;

export default function MasterItemButton({ onConfirm, disabled, children }: MasterItemButtonProps) {
  const showToast = useToastStore((state) => state.showToast);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pressActiveRef = useRef(false);
  const holdReadyRef = useRef(false);
  const suppressClickRef = useRef(false);

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

    pressActiveRef.current = true;
    holdReadyRef.current = false;
    suppressClickRef.current = false;
    clearHoldTimer();

    timeoutRef.current = globalThis.setTimeout(() => {
      timeoutRef.current = null;
      holdReadyRef.current = true;
    }, HOLD_DURATION_MS);
  }, [clearHoldTimer, disabled]);

  const handlePressEnd = useCallback(() => {
    if (!pressActiveRef.current) {
      return;
    }

    pressActiveRef.current = false;
    clearHoldTimer();

    if (!holdReadyRef.current) {
      return;
    }

    holdReadyRef.current = false;
    suppressClickRef.current = true;

    void (async () => {
      try {
        await onConfirm();
        showToast(TEXTS.skipSuccessToast, 'success');
      } catch {
        showToast(TEXTS.skipErrorToast, 'error');
      }
    })();
  }, [clearHoldTimer, onConfirm, showToast]);

  const handlePressCancel = useCallback(() => {
    pressActiveRef.current = false;
    holdReadyRef.current = false;
    clearHoldTimer();
  }, [clearHoldTimer]);

  const handleClick = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();

      if (disabled) {
        return;
      }

      if (suppressClickRef.current) {
        suppressClickRef.current = false;
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
    <ControlButton
      icon={<ForwardIcon />}
      label={TEXTS.complete}
      className="pos-help-top-left"
      onPointerDown={handlePressStart}
      onPointerUp={handlePressEnd}
      onPointerLeave={handlePressCancel}
      onPointerCancel={handlePressCancel}
      onClick={handleClick}
      disabled={disabled}
    >
      {children}
    </ControlButton>
  );
}
