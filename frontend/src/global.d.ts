declare global {
  interface Turnstile {
    render: (
      container: HTMLElement,
      options: {
        sitekey: string;
        callback: (token: string) => void;
        'error-callback'?: () => void;
        'expired-callback'?: () => void;
        theme?: 'light' | 'dark' | 'auto';
        size?: 'normal' | 'compact' | 'flexible';
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
