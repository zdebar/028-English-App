import PropertyView from '@/components/UI/PropertyView';
import { supabaseInstance } from '@/config/supabase.config';
import { TEXTS } from '@/config/texts';
import { useAuthStore } from '@/features/auth/use-auth-store';
import Dashboard from '@/features/dashboard/Dashboard';
import PrivacyPolicyLink from '@/features/privacy-policy/PrivacyPolicyLink';
import { useThemeStore } from '@/features/theme/use-theme';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';

export default function Home() {
  const theme = useThemeStore((state) => state.theme);
  const userId = useAuthStore((state) => state.userId);
  const userEmail = useAuthStore((state) => state.userEmail);

  return (
    <div className="max-w-hero relative flex w-full flex-col items-center justify-start gap-4 text-center">
      <h1 className="pt-12 pb-6 landscape:pt-6">{TEXTS.appTitle}</h1>
      <p className="notification error-warning">{TEXTS.appSubtitle}</p>
      <p className="px-4">{TEXTS.appDescription}</p>

      {userId ? (
        <div className="relative flex w-full flex-col gap-1">
          <PropertyView label={TEXTS.userLabel} className="h-input" value={userEmail} />
          <Dashboard />
        </div>
      ) : (
        <div className="w-full">
          <Auth
            supabaseClient={supabaseInstance}
            appearance={{
              theme: ThemeSupa,
              style: { button: { width: '100%', borderRadius: '0px' } },
              variables: {
                default: {
                  colors:
                    theme === 'dark'
                      ? {
                          messageText: 'white',
                          defaultButtonText: 'black',
                          anchorTextColor: 'white',
                          messageTextDanger: 'red',
                          inputLabelText: 'white',
                          brand: 'green',
                          brandAccent: 'green',
                          inputBorder: 'white',
                        }
                      : {
                          messageText: 'black',
                          defaultButtonText: 'black',
                          anchorTextColor: 'black',
                          messageTextDanger: 'red',
                          inputLabelText: 'black',
                          brand: 'green',
                          brandAccent: 'green',
                          inputBorder: 'black',
                        },
                },
              },
            }}
            providers={['google']}
            onlyThirdPartyProviders
            queryParams={{ prompt: 'select_account' }}
          />
          <PrivacyPolicyLink />
        </div>
      )}
    </div>
  );
}
