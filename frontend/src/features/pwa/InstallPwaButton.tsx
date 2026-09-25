import { TEXTS } from '@/locales/cs';
import { usePwaStore } from './use-pwa-store';

type InstallPWAButtonProps = Readonly<{
  className?: string;
}>;

export function InstallPWAButton({ className }: InstallPWAButtonProps) {
  const promptEvent = usePwaStore((state) => state.promptEvent);
  const clearPromptEvent = usePwaStore((state) => state.clearPromptEvent);

  if (!promptEvent) {
    return null;
  }

  const handleInstall = () => {
    if (promptEvent) {
      promptEvent.prompt();
      promptEvent.userChoice.then(() => clearPromptEvent());
    }
  };

  return (
    <button
      type="button"
      title={TEXTS.installButtonTooltip}
      onClick={handleInstall}
      className={`cursor-pointer ${className ?? ''}`.trim()}
    >
      {TEXTS.installButton}
    </button>
  );
}
