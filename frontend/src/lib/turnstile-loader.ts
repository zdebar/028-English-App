const TURNSTILE_SCRIPT_ID = 'cf-turnstile-script';
const TURNSTILE_SCRIPT_URL = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

let loadPromise: Promise<void> | null = null;

export function ensureTurnstileLoaded(): Promise<void> {
  if ((globalThis as any).turnstile) return Promise.resolve();
  if (loadPromise) return loadPromise;

  loadPromise = new Promise<void>((resolve, reject) => {
    const existing = document.getElementById(TURNSTILE_SCRIPT_ID) as HTMLScriptElement | null;
    if (existing) {
      const rs = (existing as any).readyState;
      const alreadyLoaded = existing.getAttribute('data-turnstile-loaded') === '1' || rs === 'complete' || rs === 'loaded';
      if (alreadyLoaded && (globalThis as any).turnstile) {
        resolve();
        return;
      }

      existing.addEventListener(
        'load',
        () => {
          try {
            existing.setAttribute('data-turnstile-loaded', '1');
          } catch {}
          resolve();
        },
        { once: true }
      );
      existing.addEventListener('error', () => reject(new Error('Turnstile script failed to load')), { once: true });
      return;
    }

    const s = document.createElement('script');
    s.id = TURNSTILE_SCRIPT_ID;
    s.src = TURNSTILE_SCRIPT_URL;
    s.async = true;
    s.defer = true;

    s.addEventListener(
      'load',
      () => {
        try {
          s.setAttribute('data-turnstile-loaded', '1');
        } catch {}
        resolve();
      },
      { once: true }
    );
    s.addEventListener('error', () => reject(new Error('Turnstile script failed to load')), { once: true });

    document.head.appendChild(s);
  });

  return loadPromise;
}

export function warmUpTurnstile(): void {
  // fire and forget; swallow errors
  ensureTurnstileLoaded().catch(() => {});
}
