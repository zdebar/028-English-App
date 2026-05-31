declare global {
  interface Window {
    dataLayer?: unknown[];
  }

  interface GlobalThis {
    dataLayer?: unknown[];
  }
}

export {};
