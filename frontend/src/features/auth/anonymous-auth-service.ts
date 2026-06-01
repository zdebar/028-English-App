import { supabaseInstance } from '@/config/supabase.config';

export async function loginAnonymous(): Promise<void> {
  const { data, error } = await supabaseInstance.auth.signInAnonymously();

  if (error) {
    throw new Error(error.message);
  }

  const session = (data as any)?.session;
  if (!session) {
    throw new Error('Anonymous sign-in failed: no session returned');
  }
}
