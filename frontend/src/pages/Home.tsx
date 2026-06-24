import { useAuthStore } from '@/features/auth/use-auth-store';
import Dashboard from '@/features/dashboard/Dashboard';
import { useUserStore } from '@/features/user-stats/use-user-store';
import { TEXTS } from '@/locales/cs';
import type { JSX } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Notification from '@/components/UI/Notification';
import '@/styles/home.css';
import { InstallPWAButton } from '@/features/pwa/InstallPwaButton';
import { useSyncStore } from '@/features/synchronization/use-sync-store';
import { ROUTES } from '@/config/routes.config';
import GoogleAuthButton from '@/features/auth/GoogleAuthButton';
import AnonymousSigninButton from '@/features/auth/AnonymousSigninButton';
import ConvertAnonymousUserButton from '@/features/auth/ConvertAnonymousUserButton';
import PropertyView from '@/components/UI/PropertyView';
import PracticeOverviewButton from '@/features/practice-overview/PracticeOverviewButton';
import SimulateDataButton from '@/features/synchronization/SimulateDataButton';
import HomePracticeButtons from '@/features/practice/HomePracticeButtons';

function HomeActionLinks(): JSX.Element {
  return (
    <div className="m-4 flex items-center justify-center gap-2 px-4">
      <InstallPWAButton className="pr-4" />
      <Link to="/guide">
        <Notification className="color-link">{TEXTS.guide}</Notification>
      </Link>
    </div>
  );
}

/**
 * The Home component renders the main page of the application.
 *
 * @returns The JSX element representing the Home page.
 */
export default function Home(): JSX.Element {
  const navigate = useNavigate();
  const userId = useAuthStore((state) => state.userId);
  const userFullName = useAuthStore((state) => state.userFullName);
  const isAnonymousUser = useAuthStore((state) => state.isAnonymousUser);
  const dailyCount = useUserStore((state) => state.dailyCount);
  const isSyncError = useSyncStore((state) => state.isSyncError);

  return (
    <div className="card-width relative flex flex-col justify-start text-center">
      {userId ? (
        <div className="home-body relative flex w-full flex-col">
          {isAnonymousUser && (
            <div className="mb-8 flex flex-col gap-2">
              <ConvertAnonymousUserButton />
              <SimulateDataButton />
            </div>
          )}
          <PropertyView
            label={TEXTS.profileNameLabel}
            className="justify-center"
            classNameLabel="w-20"
            classNameValue="wrap-break-word"
          >
            {userFullName ?? TEXTS.notAvailable}
          </PropertyView>
          <HomeActionLinks />
          <PracticeOverviewButton
            count={dailyCount}
            onClick={() => navigate(ROUTES.practiceOverview)}
            ariaLabel={TEXTS.practiceOverviewOpen}
            helpText={TEXTS.starsToday}
          />
          <HomePracticeButtons userId={userId} />
          {isSyncError && (
            <p className="text-error-light dark:text-error-dark px-4 pt-2 text-left text-sm">
              {TEXTS.syncWarning}
            </p>
          )}
          <Dashboard className="pt-4" />
        </div>
      ) : (
        <div className="home-body w-full">
          <h1 className="home-title">{TEXTS.appTitle}</h1>
          <p className="m-4 landscape:hidden">{TEXTS.appDescription}</p>
          <HomeActionLinks />
          <div className="flex flex-col gap-1">
            <AnonymousSigninButton />
            <GoogleAuthButton />
          </div>
          <p className="p-4 text-sm">{TEXTS.signupHint}</p>
        </div>
      )}
    </div>
  );
}
