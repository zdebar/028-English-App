import { useEffect, useRef, type JSX } from 'react';

type DemoCaptchaProps = Readonly<{
  siteKey: string;
  size?: 'normal' | 'compact' | 'flexible';
  onTokenChange: (token: string | null) => void;
}>;

const TURNSTILE_SCRIPT_ID = 'cf-turnstile-script';
const TURNSTILE_SCRIPT_URL =
  'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

export default function DemoCaptcha({
  siteKey,
  size = 'flexible',
  onTokenChange,
}: DemoCaptchaProps): JSX.Element {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);

  useEffect(() => {
    const safeRemoveWidget = () => {
      const id = widgetIdRef.current;
      if (!id) return;

      const ts = (globalThis as unknown as { turnstile?: Turnstile }).turnstile;
      if (!ts || typeof ts.remove !== 'function') return;

      try {
        ts.remove(id);
      } catch {
        // Ignore stale widget warnings from Turnstile during remounts/HMR.
      }
      widgetIdRef.current = null;
    };

    const renderWidget = () => {
      if (!containerRef.current || widgetIdRef.current) {
        return;
      }

      const ts = (globalThis as unknown as { turnstile?: Turnstile }).turnstile;
      if (!ts || typeof ts.render !== 'function') return;

      widgetIdRef.current = ts.render(containerRef.current, {
        sitekey: siteKey,
        size,
        callback: (token: string) => onTokenChange(token),
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

  return <div ref={containerRef} className="w-full" />;
}
