import Notification from '@/components/UI/Notification';
import { TEXTS } from '@/locales/cs';
import { useEffect } from 'react';
import { usePwaStore } from './use-pwa-store';

export interface InstallPWAButtonProps extends React.HTMLAttributes<HTMLParagraphElement> {
  className?: string;
}

export function InstallPWAButton(props: InstallPWAButtonProps) {
  const promptEvent = usePwaStore(state => state.promptEvent);
  const setPromptEvent = usePwaStore(state => state.setPromptEvent);
  const clearPromptEvent = usePwaStore(state => state.clearPromptEvent);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setPromptEvent(e as any);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, [setPromptEvent]);

  const handleInstall = () => {
    if (promptEvent) {
      promptEvent.prompt();
      promptEvent.userChoice.then(() => clearPromptEvent());
    }
  };

  if (!promptEvent) return null;

  return (
    <Notification
      {...props}
      title={TEXTS.installButtonTooltip}
      onClick={handleInstall}
      className={`color-link cursor-pointer ${props.className}`}
    >{TEXTS.installButton}</Notification>
  );
}
