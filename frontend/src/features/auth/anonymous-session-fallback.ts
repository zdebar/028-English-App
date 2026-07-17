import { supabaseInstance } from '@/config/supabase.config';
import type { Session } from '@supabase/supabase-js';

const STORAGE_KEY = 'google-signin-anonymous-session-fallback';
const FALLBACK_MAX_AGE_MS = 15 * 60 * 1000;
const FALLBACK_INTENT = 'sign-in-existing-google-account';

type StoredAnonymousSession = Readonly<{
  accessToken: string;
  refreshToken: string;
  userId: string;
  intent: typeof FALLBACK_INTENT;
  savedAt: number;
}>;

function isAnonymousSession(session: Session | null): session is Session {
  return session?.user.is_anonymous === true;
}

function isStoredAnonymousSession(value: unknown): value is StoredAnonymousSession {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as Partial<StoredAnonymousSession>;
  const age = Date.now() - (candidate.savedAt ?? 0);

  return (
    typeof candidate.accessToken === 'string' &&
    candidate.accessToken.length > 0 &&
    typeof candidate.refreshToken === 'string' &&
    candidate.refreshToken.length > 0 &&
    typeof candidate.userId === 'string' &&
    candidate.userId.length > 0 &&
    candidate.intent === FALLBACK_INTENT &&
    typeof candidate.savedAt === 'number' &&
    age >= 0 &&
    age <= FALLBACK_MAX_AGE_MS
  );
}

function readAnonymousSessionFallback(): StoredAnonymousSession | null {
  const serialized = globalThis.sessionStorage.getItem(STORAGE_KEY);
  if (!serialized) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(serialized);
    if (isStoredAnonymousSession(parsed)) {
      return parsed;
    }
  } catch {
    // Invalid fallback data is removed below.
  }

  clearAnonymousSessionFallback();
  return null;
}

export function saveAnonymousSessionFallback(session: Session): void {
  if (!isAnonymousSession(session) || !session.access_token || !session.refresh_token) {
    throw new Error('A valid anonymous session is required before Google sign-in.');
  }

  const fallback: StoredAnonymousSession = {
    accessToken: session.access_token,
    refreshToken: session.refresh_token,
    userId: session.user.id,
    intent: FALLBACK_INTENT,
    savedAt: Date.now(),
  };

  globalThis.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(fallback));
}

export function clearAnonymousSessionFallback(): void {
  globalThis.sessionStorage.removeItem(STORAGE_KEY);
}

export function hasAnonymousSessionFallback(): boolean {
  return readAnonymousSessionFallback() !== null;
}

export async function restoreAnonymousSessionFallback(): Promise<Session> {
  const fallback = readAnonymousSessionFallback();
  if (!fallback) {
    throw new Error('No valid anonymous session fallback is available.');
  }

  try {
    const { data, error } = await supabaseInstance.auth.setSession({
      access_token: fallback.accessToken,
      refresh_token: fallback.refreshToken,
    });
    if (error) {
      throw error;
    }

    const restoredSession = data.session;
    if (!isAnonymousSession(restoredSession) || restoredSession.user.id !== fallback.userId) {
      await supabaseInstance.auth.signOut({ scope: 'local' });
      throw new Error('Restored session does not match the anonymous session fallback.');
    }

    return restoredSession;
  } finally {
    clearAnonymousSessionFallback();
  }
}

export function clearAuthErrorParameters(): void {
  const url = new URL(globalThis.location.href);
  url.searchParams.delete('error');
  url.searchParams.delete('error_code');
  url.searchParams.delete('error_description');

  globalThis.history.replaceState(
    globalThis.history.state,
    '',
    `${url.pathname}${url.search}${url.hash}`,
  );
}
