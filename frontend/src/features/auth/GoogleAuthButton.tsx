import { supabaseInstance } from '@/config/supabase.config';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { type JSX } from 'react';
import * as cs from '@/locales/cs.json';

const GOOGLE_AUTH_APPEARANCE = {
  theme: ThemeSupa,
  style: {
    button: {
      width: '100%',
      borderRadius: '0px',
      minHeight: 'var(--height-button)',
      fontFamily: 'var(--font-body)',
      fontSize: '1rem',
      fontWeight: '500',
      margin: '0',
    },
    container: {
      margin: '0',
    },
  },
  variables: {
    default: {
      colors: {
        messageText: 'var(--color-auth-message)',
        defaultButtonBackground: 'var(--color-signin-button)',
        defaultButtonBackgroundHover: 'var(--color-signin-button-hover)',
        defaultButtonBorder: 'var(--color-auth-button-border)',
        defaultButtonText: 'var(--color-auth-button-text)',
        anchorTextColor: 'var(--color-auth-button-text)',
        messageTextDanger: 'var(--color-auth-danger)',
        inputLabelText: 'var(--color-auth-button-text)',
        brand: 'var(--color-auth-brand)',
        brandAccent: 'var(--color-auth-brand)',
        inputBorder: 'var(--color-auth-button-border)',
      },
    },
  },
};

const AUTH_REDIRECT_TO = new URL(import.meta.env.BASE_URL, globalThis.location.origin).toString();

export default function GoogleAuthButton(): JSX.Element {
  return (
    <Auth
      supabaseClient={supabaseInstance}
      appearance={GOOGLE_AUTH_APPEARANCE}
      providers={['google']}
      localization={{ variables: cs }}
      onlyThirdPartyProviders
      redirectTo={AUTH_REDIRECT_TO}
      queryParams={{ prompt: 'select_account' }}
    />
  );
}
