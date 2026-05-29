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
        messageText: 'black',
        defaultButtonBackground: 'var(--color-signin-button)',
        defaultButtonBackgroundHover: 'var(--color-signin-button-hover)',
        defaultButtonBorder: 'white',
        defaultButtonText: 'black',
        anchorTextColor: 'black',
        messageTextDanger: 'red',
        inputLabelText: 'black',
        brand: 'green',
        brandAccent: 'green',
        inputBorder: 'white',
      },
    },
  },
};

export default function GoogleAuthButton(): JSX.Element {
  return (
    <Auth
      supabaseClient={supabaseInstance}
      appearance={GOOGLE_AUTH_APPEARANCE}
      providers={['google']}
      localization={{ variables: cs }}
      onlyThirdPartyProviders
      queryParams={{ prompt: 'select_account' }}
    />
  );
}
