import PropertyView from '@/components/UI/PropertyView';
import { supabaseInstance } from '@/config/supabase.config';
import { useAuthStore } from '@/features/auth/use-auth-store';
import Dashboard from '@/features/dashboard/Dashboard';
import { useThemeStore } from '@/features/theme/use-theme';
import { useUserStore } from '@/features/dashboard/use-user-store';
import { TEXTS } from '@/locales/cs';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { type JSX } from 'react';
import { Link } from 'react-router-dom';
import config from '@/config/config';

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
  const userStats = useUserStore((state) => state.userStats);

  const practiceCountToday = userStats?.practiceCountToday || 0;
  const dailyGoal = config.practice.dailyGoal;
  const isPracticeGoalMet = practiceCountToday >= dailyGoal;

  let mainSection: JSX.Element;
  if (userId) {
    // User is authenticated - show dashboard
    mainSection = (
      <div className="relative flex w-full flex-col">
        <PropertyView
          label={TEXTS.userLabel}
          className="h-attribute"
          value={userFullName || userEmail}
        />
        <PropertyView
          label={TEXTS.userStatsLabel}
          className="h-attribute"
          classNameValue={
            (isPracticeGoalMet
              ? 'text-success-light dark:text-success-dark'
              : 'text-error-light dark:text-error-dark') + ' font-bold'
          }
          value={`${practiceCountToday} / ${dailyGoal}`}
        />
        <Dashboard className="pt-4" />
      </div>
    );
  } else {
    // User is not authenticated - show login
    mainSection = (
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
        <p className="px-4 text-sm">{TEXTS.signupHint}</p>
      </div>
    );
  }

  return (
    <div className="max-w-hero relative flex w-full flex-col gap-4 text-center">
      <h1 className="pt-12 pb-6">{TEXTS.appTitle}</h1>
      <p className="px-4">{TEXTS.appDescription}</p>
      <Link to="/guide" className="notification error-warning">
        {TEXTS.guide}
      </Link>
      {mainSection}
    </div>
  );
}
