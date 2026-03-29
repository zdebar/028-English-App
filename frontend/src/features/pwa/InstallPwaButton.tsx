import NotificationText from '@/components/UI/NotificationText';
import { TEXTS } from '@/locales/cs';
import { useEffect, useState } from 'react';

export interface InstallPWAButtonProps extends React.HTMLAttributes<HTMLParagraphElement> {
  className?: string;
}

export function InstallPWAButton(props: InstallPWAButtonProps) {
  const [promptEvent, setPromptEvent] = useState<any>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setPromptEvent(e as any);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = () => {
    if (promptEvent) {
      promptEvent.prompt();
      promptEvent.userChoice.then(() => setPromptEvent(null));
    }
  };

  if (!promptEvent) return null;

  return (
    <NotificationText
      {...props}
      text={TEXTS.installButton}
      title={TEXTS.installButtonTooltip}
      onClick={handleInstall}
      className={`color-link cursor-pointer ${props.className}`}
    />
  );
}
