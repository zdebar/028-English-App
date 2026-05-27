import { useEffect, useRef, type JSX } from 'react';

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          'error-callback'?: () => void;
          'expired-callback'?: () => void;
          theme?: 'light' | 'dark' | 'auto';
          size?: 'normal' | 'compact';
        },
      ) => string;
      remove: (widgetId: string) => void;
    };
  }
}

type DemoCaptchaProps = Readonly<{
  siteKey: string;
  size?: 'normal' | 'compact';
  onTokenChange: (token: string | null) => void;
}>;

const TURNSTILE_SCRIPT_ID = 'cf-turnstile-script';
const TURNSTILE_SCRIPT_URL =
  'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

export default function DemoCaptcha({
  siteKey,
  size = 'normal',
  onTokenChange,
}: DemoCaptchaProps): JSX.Element {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);

  useEffect(() => {
    const safeRemoveWidget = () => {
      if (!widgetIdRef.current || !window.turnstile) {
        return;
      }

      try {
        window.turnstile.remove(widgetIdRef.current);
      } catch {
        // Ignore stale widget warnings from Turnstile during remounts/HMR.
      }
      widgetIdRef.current = null;
    };

    const renderWidget = () => {
      if (!containerRef.current || !window.turnstile) {
        return;
      }

      if (widgetIdRef.current) {
        return;
      }

      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        size,
        callback: (token) => onTokenChange(token),
        'error-callback': () => onTokenChange(null),
        'expired-callback': () => onTokenChange(null),
      });
    };

    const existing = document.getElementById(TURNSTILE_SCRIPT_ID) as HTMLScriptElement | null;
    if (existing) {
      renderWidget();
      return () => {
        safeRemoveWidget();
      };
    }

    const script = document.createElement('script');
    script.id = TURNSTILE_SCRIPT_ID;
    script.src = TURNSTILE_SCRIPT_URL;
    script.async = true;
    script.defer = true;
    script.onload = renderWidget;
    document.head.appendChild(script);

    return () => {
      safeRemoveWidget();
    };
  }, [onTokenChange, siteKey, size]);

  return <div ref={containerRef} className="mt-3 flex justify-center" />;
}
