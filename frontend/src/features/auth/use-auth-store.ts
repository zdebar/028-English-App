import { create } from 'zustand';
import type { Session } from '@supabase/supabase-js';
import { supabaseInstance } from '@/config/supabase.config';
import { AuthenticationError } from '@/types/error.types';

interface AuthState {
  userId: string | null;
  userEmail: string | null;
  loading: boolean;
  setSession: (session: Session | null) => void;
  initializeAuth: () => () => void;
  handleLogout: () => Promise<void>;
}

/**
 * Zustand store for managing authentication state.
 */
export const useAuthStore = create<AuthState>((set, get) => ({
  userId: null,
  userEmail: null,
  loading: true,

  setSession: (session) => {
    set({
      userId: session?.user?.id ?? null,
      userEmail: session?.user?.email || null,
      loading: false,
    });
  },

  initializeAuth: () => {
    let subscription: { unsubscribe: () => void } | null = null;
    const { setSession } = get();

    const fetchSession = async () => {
      const { data, error } = await supabaseInstance.auth.getSession();
      if (error) {
        setSession(null);
      } else {
        setSession(data.session);
      }
    };

    fetchSession();

    subscription = supabaseInstance.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    }).data.subscription;

    return () => {
      if (subscription) subscription.unsubscribe();
    };
  },

  handleLogout: async () => {
    const { error } = await supabaseInstance.auth.signOut();
    if (error) {
      throw new AuthenticationError(error.message, error);
    }
    set({ userId: null, userEmail: null, loading: false });
  },
}));
