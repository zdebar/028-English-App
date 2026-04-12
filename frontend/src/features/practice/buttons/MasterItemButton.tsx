import { useCallback, useEffect, useRef } from 'react';
import BaseButton from '@/components/UI/buttons/BaseButton';
import ForwardIcon from '@/components/UI/icons/ForwardIcon';
import HelpText from '@/features/help/HelpText';
import { useToastStore } from '@/features/toast/use-toast-store';
import { TEXTS } from '@/locales/cs';

type SkipButtonProps = {
  onConfirm: () => void | Promise<void>;
  disabled: boolean;
  children?: React.ReactNode;
};

const HOLD_DURATION_MS = 600;

export default function MasterItemButton({ onConfirm, disabled, children }: SkipButtonProps) {
  const showToast = useToastStore((state) => state.showToast);
  const timeoutRef = useRef<number | null>(null);
  const longPressTriggeredRef = useRef(false);

  const clearHoldTimer = useCallback(() => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const triggerSkip = useCallback(async () => {
    try {
      await onConfirm();
      showToast(TEXTS.skipSuccessToast, 'success');
    } catch {
      showToast(TEXTS.skipErrorToast, 'error');
    }
  }, [onConfirm, showToast]);

  const handlePressStart = useCallback(() => {
    if (disabled) {
      return;
    }

    longPressTriggeredRef.current = false;
    clearHoldTimer();

    timeoutRef.current = window.setTimeout(() => {
      longPressTriggeredRef.current = true;
      void triggerSkip();
    }, HOLD_DURATION_MS);
  }, [clearHoldTimer, disabled, triggerSkip]);

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
    <BaseButton
      onMouseDown={handlePressStart}
      onMouseUp={handlePressEnd}
      onMouseLeave={handlePressEnd}
      onTouchStart={handlePressStart}
      onTouchEnd={handlePressEnd}
      onTouchCancel={handlePressEnd}
      onClick={handleClick}
      disabled={disabled}
      className="h-button relative"
      title={!disabled ? TEXTS.complete : undefined}
    >
      <ForwardIcon />
      <HelpText className="-top-4.5 left-4">{TEXTS.complete}</HelpText>
      {children}
    </BaseButton>
  );
}
