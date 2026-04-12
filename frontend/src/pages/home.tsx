import PropertyView from '@/components/UI/PropertyView';
import { supabaseInstance } from '@/config/supabase.config';
import { useAuthStore } from '@/features/auth/use-auth-store';
import Dashboard from '@/components/UI/Dashboard';
import { useThemeStore } from '@/features/theme/use-theme-store';
import { useUserStore } from '@/features/user-stats/use-user-store';
import { TEXTS } from '@/locales/cs';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { useMemo, type JSX } from 'react';
import { Link } from 'react-router-dom';
import config from '@/config/config';
import Notification from '@/components/UI/Notification';
import GoalMetView from '@/components/UI/GoalMetView';
import { InstallPWAButton } from '@/features/pwa/InstallPwaButton';

/**
 * The Home component renders the main page of the application.
 *
 * @returns The JSX element representing the Home page.
 */
export default function Home(): JSX.Element {
  const theme = useThemeStore((state) => state.theme);
  const userId = useAuthStore((state) => state.userId);
  const userFullName = useAuthStore((state) => state.userFullName);
  const userEmail = useAuthStore((state) => state.userEmail);
  const dailyCount = useUserStore((state) => state.dailyCount);
  const dailyGoal = config.practice.dailyGoal;
  const userDisplayName = userFullName || userEmail;

  const authAppearance = useMemo(
    () => ({
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
    }),
    [theme],
  );

  return (
    <div className="max-w-hero relative flex w-full flex-col text-center">
      <h1 className="my-8">{TEXTS.appTitle}</h1>
      <InstallPWAButton className="my-2 px-4" />

      <p className="px-4">{TEXTS.appDescription}</p>
      <p className="text-error-light dark:text-error-dark px-4">{TEXTS.appTestDescription}</p>
      <Link to="/guide" className="my-">
        <Notification className="color-link">{TEXTS.guide}</Notification>
      </Link>

      {userId ? (
        <div className="relative mt-8 flex w-full flex-col">
          <div className="px-4">
            <PropertyView label={TEXTS.userLabel}>{userDisplayName}</PropertyView>
            <PropertyView
              label={TEXTS.userStatsLabel}
              title={`${TEXTS.today} / ${TEXTS.dailyGoal}`}
            >
              {GoalMetView({ current: dailyCount, goal: dailyGoal })}
            </PropertyView>
          </div>
          <Dashboard className="pt-4" />
        </div>
      ) : (
        <div className="mt-8 w-full">
          <Auth
            supabaseClient={supabaseInstance}
            appearance={authAppearance}
            providers={['google']}
            onlyThirdPartyProviders
            queryParams={{ prompt: 'select_account' }}
          />
          <p className="px-4 text-sm">{TEXTS.signupHint}</p>
        </div>
      )}
    </div>
  );
}
