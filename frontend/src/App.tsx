import Footer from '@/components/Layout/Footer';
import Header from '@/components/Layout/Header';
import { usePeriodicSync } from '@/features/synchronization/use-periodic-sync';
import { useAuthStore } from '@/features/auth/use-auth-store';
import IdentityLinkConflictModal from '@/features/auth/IdentityLinkConflictModal';
import { GoogleAnalytics } from '@/features/analytics/GoogleAnalytics';
import OverlayMask from '@/features/overlay/OverlayMask';
import { useThemeLoader } from '@/features/theme/use-theme-loader';
import ToastContainer from '@/features/toast/ToastContainer';
import { useUserStoreSync } from '@/features/user-stats/use-user-store-sync';
import { Outlet } from 'react-router-dom';
import './styles/index.css';
import { useAudioLoader } from './features/audio/use-audio-loader';
import { usePronunciationGroupsStoreSync } from './features/pronunciation/use-pronunciation-groups-store-sync';
import { usePracticeAvailabilityStoreSync } from './features/practice/use-practice-availability-store-sync';
import { useResponsiveLayout } from './components/Layout/use-responsive-layout';

export default function App() {
  const userId = useAuthStore((state) => state.userId);
  const authLoading = useAuthStore((state) => state.loading);

  useAudioLoader(userId);
  useUserStoreSync(userId);
  usePracticeAvailabilityStoreSync(userId);
  usePronunciationGroupsStoreSync(userId);
  useThemeLoader(userId, authLoading);
  usePeriodicSync(userId);
  const { headerLayout, secondaryLayout } = useResponsiveLayout();

  return (
    <>
      <GoogleAnalytics />
      <div
        className="app-shell max-w-container relative mx-auto flex flex-col justify-start"
        data-header-layout={headerLayout}
        data-secondary-layout={secondaryLayout}
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
    </>
  );
}
