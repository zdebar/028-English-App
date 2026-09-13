const authRedirectUrl = new URL(import.meta.env.BASE_URL, globalThis.location.origin);

export const AUTH_REDIRECT_TO = authRedirectUrl.toString();
