import { useAuthStore } from '@/features/auth/use-auth-store';
import DelayedMessage from '@/components/UI/DelayedMessage';
import Dashboard from '@/features/dashboard/Dashboard';
import { TEXTS } from '@/locales/cs';
import type { JSX } from 'react';
import { Link } from 'react-router-dom';
import { InstallPWAButton } from '@/features/pwa/InstallPwaButton';
import { useSyncStore } from '@/features/synchronization/use-sync-store';
import GoogleAuthButton from '@/features/auth/GoogleAuthButton';
import AnonymousSigninButton from '@/features/auth/AnonymousSigninButton';
import ConvertAnonymousUserButton from '@/features/auth/ConvertAnonymousUserButton';
import SimulateDataButton from '@/features/synchronization/SimulateDataButton';
import PracticeButton from '@/features/practice/PracticeButton';
import HelpButton from '@/features/help/HelpButton';

const HOME_TEXT_ACTION_CLASS_NAME =
  'color-info font-headings text-center text-lg decoration-current underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2';

function HomeActionLinks(): JSX.Element {
  return (
    <div className="flex items-center justify-center gap-6 px-4">
      <Link to="/guide" className={HOME_TEXT_ACTION_CLASS_NAME}>
        {TEXTS.guide}
      </Link>
      <InstallPWAButton className={`${HOME_TEXT_ACTION_CLASS_NAME}`} />
    </div>
  );
}

/**
 * The Home component renders the main page of the application.
 *
 * @returns The JSX element representing the Home page.
 */
export default function Home(): JSX.Element {
  const userId = useAuthStore((state) => state.userId);
  const isAnonymousUser = useAuthStore((state) => state.isAnonymousUser);
  const authLoading = useAuthStore((state) => state.loading);
  const isSyncError = useSyncStore((state) => state.isSyncError);

  if (authLoading) {
    return (
      <div className="card-width mt-20 w-full">
        <DelayedMessage />
      </div>
    );
  }

  return (
    <>
      {userId ? (
        <div className="card-width relative flex h-full w-full grow flex-col justify-start gap-8">
          <div className="flex flex-col gap-0 pt-2">
            <div className="landscape:mt-6">
              <HomeActionLinks />
            </div>
            <p className={`text-error-light dark:text-error-dark px-4 text-center text-sm`}>
              Aplikace v testovacím režimu! V tuto chvíli Vaše tréninková data nebudou zachována.
            </p>
          </div>
          {isAnonymousUser && (
            <div className="flex flex-col gap-1">
              <ConvertAnonymousUserButton />
              <SimulateDataButton />
            </div>
          )}
          <div className="flex w-full flex-col">
            <PracticeButton />
          </div>
          <div className="relative">
            <p
              className={`text-error-light dark:text-error-dark px-4 py-2 text-center text-sm ${isSyncError ? 'visible' : 'hidden'}`}
            >
              {TEXTS.syncWarning}
            </p>
            <div className="home-bottom-controls-clearance relative">
              <Dashboard />
              <div className="pos-home-dashboard-help">
                <HelpButton />
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="card-width w-full landscape:pt-8">
          <h1 className="mx-auto">{TEXTS.appTitle}</h1>
          <p className="mx-auto landscape:hidden">{TEXTS.appDescription}</p>
          <HomeActionLinks />
          <div className="flex flex-col gap-1 pt-8">
            <AnonymousSigninButton />
            <GoogleAuthButton />
          </div>
          <p className="p-4 text-center text-sm">{TEXTS.signupHint}</p>
        </div>
      )}
    </>
  );
}
