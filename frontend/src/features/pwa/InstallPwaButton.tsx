import { useEffect, useState } from 'react';

export function InstallPWAButton() {
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

  return <button onClick={handleInstall}>Instalovat aplikaci</button>;
}
