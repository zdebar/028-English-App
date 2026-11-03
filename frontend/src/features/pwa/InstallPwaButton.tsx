import { TEXTS } from '@/locales/cs';
import { reportError } from '@/features/logging/logging-handler';
import { usePwaStore } from './use-pwa-store';
import type { JSX } from 'react';

type InstallPWAButtonProps = Readonly<{
  className?: string;
}>;

export function InstallPWAButton({ className }: InstallPWAButtonProps): JSX.Element | null {
  const promptEvent = usePwaStore((state) => state.promptEvent);
  const clearPromptEvent = usePwaStore((state) => state.clearPromptEvent);

  if (!promptEvent) {
    return null;
  }

  const handleInstall = async (): Promise<void> => {
    if (!promptEvent) return;

    try {
      await promptEvent.prompt();
      await promptEvent.userChoice;
    } catch (error) {
      reportError('PWA installation prompt failed', error);
    } finally {
      clearPromptEvent();
    }
  };

  return (
    <button
      type="button"
      title={TEXTS.installButtonTooltip}
      onClick={() => void handleInstall()}
      className={`cursor-pointer ${className ?? ''}`.trim()}
    >
      {TEXTS.installButton}
    </button>
  );
}
