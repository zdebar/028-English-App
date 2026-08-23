import { useAuthStore } from '@/features/auth/use-auth-store';
import Dashboard from '@/features/dashboard/Dashboard';
import { useUserStore } from '@/features/user-stats/use-user-store';
import { TEXTS } from '@/locales/cs';
import type { JSX } from 'react';
import { Link } from 'react-router-dom';
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
import PracticeButton from '@/features/practice/PracticeButton';
import HelpButton from '@/features/help/HelpButton';
import PronunciationPracticeButton from '@/features/pronunciation/PronunciationPracticeButton';
import PronunciationGroupsButton from '@/features/pronunciation/PronunciationGroupsButton';
import { practiceOverviewDescriptor } from '@/routing/route-data';

function HomeActionLinks(): JSX.Element {
  return (
    <div className="flex items-center justify-center gap-2 px-4">
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
  const userId = useAuthStore((state) => state.userId);
  const userFullName = useAuthStore((state) => state.userFullName);
  const isAnonymousUser = useAuthStore((state) => state.isAnonymousUser);
  const dailyStarCount = useUserStore((state) => state.dailyStarCount);
  const isSyncError = useSyncStore((state) => state.isSyncError);

  return (
    <>
      {userId ? (
        <div className="card-width relative flex h-full w-full grow flex-col justify-start gap-2 sm:gap-4">
          <div className="landscape:mt-6">
            <PropertyView
              label={TEXTS.profileNameLabel}
              className="justify-center"
              classNameLabel="w-20"
              classNameValue="wrap-break-word"
            >
              {userFullName ?? TEXTS.notAvailable}
            </PropertyView>
            <HomeActionLinks />
          </div>
          <p className={`text-error-light dark:text-error-dark px-4 text-center text-sm`}>
            Aplikace v testovacím režimu! V tuto chvíli Vaše tréninková data nebudou zachována.
          </p>
          {isAnonymousUser && (
            <div className="flex flex-col gap-2">
              <ConvertAnonymousUserButton />
              <SimulateDataButton />
            </div>
          )}
          <PracticeOverviewButton
            count={dailyStarCount}
            to={ROUTES.practiceOverview}
            descriptor={practiceOverviewDescriptor(userId)}
            ariaLabel={TEXTS.practiceOverviewOpen}
            helpText={TEXTS.starsToday}
          />
          <div className="flex w-full flex-col gap-3">
            <fieldset className="flex min-w-0 flex-col gap-1">
              <legend className="font-headings w-full pb-1 text-center">
                {TEXTS.studySection}
              </legend>
              <PracticeButton userId={userId} />
            </fieldset>
            <fieldset className="flex min-w-0 flex-col gap-1">
              <legend className="font-headings w-full pb-1 text-center">
                {TEXTS.pronunciationSection}
              </legend>
              <div className="flex w-full gap-1">
                <PronunciationPracticeButton userId={userId} />
                <PronunciationGroupsButton />
              </div>
            </fieldset>
          </div>
          <div className="relative">
            <p
              className={`text-error-light dark:text-error-dark px-4 py-2 text-center text-sm ${isSyncError ? 'visible' : 'invisible'}`}
            >
              {TEXTS.syncWarning}
            </p>
            <div className="home-bottom-controls-clearance relative">
              <Dashboard userId={userId} />
              <div className="pos-home-dashboard-help">
                <HelpButton />
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="card-width w-full">
          <h1 className="mx-auto mt-4">{TEXTS.appTitle}</h1>
          <p className="mx-auto my-4 landscape:hidden">{TEXTS.appDescription}</p>
          <HomeActionLinks />
          <div className="flex flex-col gap-1 pt-4">
            <AnonymousSigninButton />
            <GoogleAuthButton />
          </div>
          <p className="p-4 text-sm">{TEXTS.signupHint}</p>
        </div>
      )}
    </>
  );
}
