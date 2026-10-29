import { usePracticeAvailabilityStoreSync } from '@/features/practice/use-practice-availability-store-sync';
import Footer from '@/components/Layout/Footer';
import Header from '@/components/Layout/Header';
import { usePeriodicSync } from '@/features/synchronization/use-periodic-sync';
import { useAuthStore } from '@/features/auth/use-auth-store';
import IdentityLinkConflictModal from '@/features/auth/IdentityLinkConflictModal';
import OverlayMask from '@/features/overlay/OverlayMask';
import { useThemeLoader } from '@/features/theme/use-theme-loader';
import ToastContainer from '@/features/toast/ToastContainer';
import { Outlet, useMatches } from 'react-router-dom';
import './styles/index.css';
import { useAudioLoader } from './features/audio/use-audio-loader';
import { useResponsiveLayout } from './components/Layout/use-responsive-layout';
import { useSideHeaderOrientation } from './components/Layout/use-side-header-orientation';

function hasAppShellBottomPadding(handle: unknown): boolean {
  if (typeof handle !== 'object' || handle === null) return false;
  return 'appShellBottomPadding' in handle && handle.appShellBottomPadding === true;
}

export default function App() {
  const userId = useAuthStore((state) => state.userId);
  const authLoading = useAuthStore((state) => state.loading);

  usePracticeAvailabilityStoreSync(userId);
  useAudioLoader(userId);
  useThemeLoader(userId, authLoading);
  usePeriodicSync(userId);
  const { headerLayout, secondaryLayout } = useResponsiveLayout();
  const sideHeaderOrientation = useSideHeaderOrientation();
  const hasBottomPadding = useMatches().some((match) => hasAppShellBottomPadding(match.handle));
  const appShellClassName = [
    'app-shell max-w-container relative mx-auto flex flex-col justify-start',
    hasBottomPadding && 'pb-1',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={appShellClassName}
      data-header-layout={headerLayout}
      data-secondary-layout={secondaryLayout}
      data-side-header-orientation={sideHeaderOrientation}
    >
      <ToastContainer />
      <OverlayMask />
      <IdentityLinkConflictModal />
      <Header />
      <main className="max-w-card relative mx-auto flex min-h-0 w-full grow flex-col items-center gap-4">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
