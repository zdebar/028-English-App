import Notification from '@/components/UI/Notification';
import { TEXTS } from '@/locales/cs';
import { useEffect } from 'react';
import { usePwaStore } from './use-pwa-store';


type InstallPWAButtonProps = Readonly<{
  className?: string;
}>;

export function InstallPWAButton({ className }: InstallPWAButtonProps) {
  const promptEvent = usePwaStore((state) => state.promptEvent);
  const setPromptEvent = usePwaStore((state) => state.setPromptEvent);
  const clearPromptEvent = usePwaStore((state) => state.clearPromptEvent);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setPromptEvent(e as any);
    };
    globalThis.addEventListener('beforeinstallprompt', handler);
    return () => {
      globalThis.removeEventListener('beforeinstallprompt', handler);
    };
  }, [setPromptEvent]);

  const handleInstall = () => {
    if (promptEvent) {
      promptEvent.prompt();
      promptEvent.userChoice.then(() => clearPromptEvent());
    }
  };

  return (
    <Notification
      title={TEXTS.installButtonTooltip}
      onClick={handleInstall}
      className={`color-link cursor-pointer ${!promptEvent && 'invisible'} ${className}`}
    >
      {TEXTS.installButton}
    </Notification>
  );
}
