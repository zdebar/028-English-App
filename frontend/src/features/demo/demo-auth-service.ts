import { supabaseInstance } from '@/config/supabase.config';

async function readErrorDetail(response: Response): Promise<string> {
  try {
    const payload = (await response.clone().json()) as {
      detail?: string;
      error?: string;
      msg?: string;
    };
    return `${payload.detail ?? ''} ${payload.error ?? ''} ${payload.msg ?? ''}`.toLowerCase();
  } catch {
    try {
      return (await response.clone().text()).toLowerCase();
    } catch {
      return '';
    }
  }
}

function mapAuthDetailFor400401(detail: string): string {
  if (detail.includes('captcha_failed') || detail.includes('captcha_token')) {
    return 'CAPTCHA_FAILED';
  }
  if (detail.includes('invalid login credentials') || detail.includes('invalid_grant')) {
    return 'DEMO_INVALID_CREDENTIALS';
  }
  if (detail.includes('email') && detail.includes('disabled')) {
    return 'DEMO_EMAIL_PROVIDER_DISABLED';
  }

  const shortDetail = detail.replace(/\s+/g, ' ').trim().slice(0, 180);
  return shortDetail ? `DEMO_AUTH_FAILED:${shortDetail}` : 'DEMO_AUTH_FAILED';
}

async function mapDemoAuthErrorCode(response?: Response): Promise<string> {
  if (!response) {
    return 'DEMO_AUTH_FAILED';
  }

  const status = response.status;
  const detail = await readErrorDetail(response);

  if (status === 429) {
    return 'RATE_LIMIT';
  }
  if (status === 403) {
    return 'CAPTCHA_FAILED';
  }
  if (status === 400 || status === 401) {
    return mapAuthDetailFor400401(detail);
  }

  return 'DEMO_AUTH_FAILED';
}

export async function loginDemoWithCaptcha(captchaToken: string): Promise<void> {
  const token = captchaToken.trim();
  if (!token) {
    throw new Error('Missing captcha token');
  }

  const { data, error } = await supabaseInstance.functions.invoke('demo-session', {
    body: { captchaToken: token },
  });

  if (error) {
    const invokeError = error as { context?: Response };
    const mapped = await mapDemoAuthErrorCode(invokeError.context);
    throw new Error(mapped || error.message);
  }

  const payload = data as {
    access_token?: string;
    refresh_token?: string;
  } | null;

  const accessToken = payload?.access_token ?? '';
  const refreshToken = payload?.refresh_token ?? '';

  if (!accessToken || !refreshToken) {
    throw new Error('Invalid demo session payload');
  }

  const { error: setSessionError } = await supabaseInstance.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });
  if (setSessionError) {
    throw new Error(setSessionError.message);
  }
}
