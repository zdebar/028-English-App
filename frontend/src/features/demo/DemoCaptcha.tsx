import { useEffect, useEffectEvent, useRef, type JSX } from 'react';
import { ensureTurnstileLoaded } from '@/features/demo/turnstile-loader';

type DemoCaptchaProps = Readonly<{
  siteKey: string;
  size?: 'normal' | 'compact' | 'flexible';
  onTokenChange: (token: string | null) => void;
}>;

export default function DemoCaptcha({
  siteKey,
  size = 'flexible',
  onTokenChange,
}: DemoCaptchaProps): JSX.Element {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);
  const emitTokenChange = useEffectEvent((token: string | null) => onTokenChange(token));

  useEffect(() => {
    let disposed = false;

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
        callback: (token: string) => emitTokenChange(token),
        'error-callback': () => emitTokenChange(null),
        'expired-callback': () => emitTokenChange(null),
      });
    };

    // ensure the Turnstile script is loaded centrally
    ensureTurnstileLoaded()
      .then(() => {
        if (!disposed) renderWidget();
      })
      .catch(() => emitTokenChange(null));

    return () => {
      disposed = true;
      safeRemoveWidget();
    };
  }, [emitTokenChange, siteKey, size]);

  return <div ref={containerRef} className="w-full" />;
}
