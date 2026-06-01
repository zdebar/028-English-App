import { supabaseInstance } from '@/config/supabase.config';

type LoginAnonymousParams = {
  captchaToken?: string;
};

export async function loginAnonymous({ captchaToken }: LoginAnonymousParams = {}): Promise<void> {
  if (!captchaToken) {
    throw new Error('Captcha token is missing for anonymous sign-in');
  }

  const { data, error } = await supabaseInstance.auth.signInAnonymously({
    options: { captchaToken },
  });

  if (error) {
    throw new Error(error.message);
  }

  const session = data?.session;
  if (!session) {
    throw new Error('Anonymous sign-in failed: no session returned');
  }
}
