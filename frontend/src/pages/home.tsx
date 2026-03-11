import PropertyView from '@/components/UI/PropertyView';
import { supabaseInstance } from '@/config/supabase.config';
import { useAuthStore } from '@/features/auth/use-auth-store';
import Dashboard from '@/features/user-stats/Dashboard';
import { useThemeStore } from '@/features/theme/use-theme-store';
import { useUserStore } from '@/features/user-stats/use-user-store';
import { TEXTS } from '@/locales/cs';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { useMemo, type JSX } from 'react';
import { Link } from 'react-router-dom';
import config from '@/config/config';
import NotificationText from '@/components/UI/NotificationText';
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
      <h1 className="py-8">{TEXTS.appTitle}</h1>
      <Link to="/guide">
        <NotificationText text={TEXTS.guide} className="color-info pb-2" />
      </Link>
      <p className="px-4">{TEXTS.appDescription}</p>
      <p className="text-error-light dark:text-error-dark px-4">{TEXTS.appTestDescription}</p>
      <InstallPWAButton className="px-4 pt-2" />

      {userId ? (
        <div className="relative flex w-full flex-col pt-12">
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
        <div className="w-full pt-12">
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
