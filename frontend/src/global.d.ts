declare global {
  interface Turnstile {
    render: (
      container: HTMLElement,
      options: {
        sitekey: string;
        callback: (token: string) => void;
        'error-callback'?: (errorCode?: string) => void;
        'expired-callback'?: () => void;
        'timeout-callback'?: () => void;
        theme?: 'light' | 'dark' | 'auto';
        size?: 'normal' | 'compact' | 'flexible';
        retry?: 'auto' | 'never';
        'retry-interval'?: number;
        'refresh-expired'?: 'auto' | 'manual' | 'never';
        'refresh-timeout'?: 'auto' | 'manual' | 'never';
        appearance?: 'always' | 'execute' | 'interaction-only';
        execution?: 'render' | 'execute';
      },
    ) => string;
    remove: (widgetId: string) => void;
  }

  interface Window {
    turnstile?: Turnstile;
    dataLayer?: unknown[];
  }

  interface GlobalThis {
    turnstile?: Turnstile;
    dataLayer?: unknown[];
  }
}

export {};
