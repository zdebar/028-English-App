import { useAuthStore } from '@/features/auth/use-auth-store';
import Dashboard from '@/components/UI/Dashboard';
import { useUserStore } from '@/features/user-stats/use-user-store';
import { TEXTS } from '@/locales/cs';
import { useState, type JSX } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Notification from '@/components/UI/Notification';
import '@/styles/home.css';
import { InstallPWAButton } from '@/features/pwa/InstallPwaButton';
import { useSyncWarningStore } from '@/features/sync/use-sync-warning';
import { ROUTES } from '@/config/routes.config';
// imports moved into PracticeOverviewButton
import DemoSessionPanel from '@/features/demo/DemoSessionPanel';
import GoogleAuthButton from '@/features/auth/GoogleAuthButton';
import PropertyView from '@/components/UI/PropertyView';
import PracticeOverviewButton from '@/components/PracticeOverviewButton';

/**
 * The Home component renders the main page of the application.
 *
 * @returns The JSX element representing the Home page.
 */
export default function Home(): JSX.Element {
  const navigate = useNavigate();
  const userId = useAuthStore((state) => state.userId);
  const userFullName = useAuthStore((state) => state.userFullName);
  const dailyCount = useUserStore((state) => state.dailyCount);
  const isSynchronized = useSyncWarningStore((state) => state.isSynchronized);
  const [isDemoCaptchaVisible, setIsDemoCaptchaVisible] = useState(false);

  return (
    <div className="max-w-hero relative flex w-full flex-col text-center">
      <h1 className="my-8">{TEXTS.appTitle}</h1>
      <InstallPWAButton className="my-2 px-4" />

      <p className="px-4">{TEXTS.appDescription}</p>
      <p className="text-error-light dark:text-error-dark">{TEXTS.appTestDescription}</p>
      <Link to="/guide" className="my-">
        <Notification className="color-link">{TEXTS.guide}</Notification>
      </Link>

      {userId ? (
        <div className="relative mt-8 flex w-full flex-col">
          <PropertyView
            label={TEXTS.profileNameLabel}
            className="justify-center"
            classNameLabel="w-20"
            classNameValue="wrap-break-word"
          >
            {userFullName ?? TEXTS.notAvailable}
          </PropertyView>
          <PracticeOverviewButton
            count={dailyCount}
            onClick={() => navigate(ROUTES.practiceOverview)}
            ariaLabel={TEXTS.practiceOverviewOpen}
            helpText={TEXTS.starsToday}
          />
          {!isSynchronized && (
            <p className="text-error-light dark:text-error-dark px-4 pt-2 text-left text-sm">
              {TEXTS.syncWarning}
            </p>
          )}
          <Dashboard className="pt-4" />
        </div>
      ) : (
        <div className="mt-8 w-full">
          <div className="flex flex-col gap-1">
            <DemoSessionPanel onCaptchaVisibilityChange={setIsDemoCaptchaVisible} />
            {!isDemoCaptchaVisible && <GoogleAuthButton />}
          </div>
          <p className="p-4 text-sm">{TEXTS.signupHint}</p>
        </div>
      )}
    </div>
  );
}
