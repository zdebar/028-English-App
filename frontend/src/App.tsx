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
import { Outlet, useLocation } from 'react-router-dom';
import './styles/index.css';
import { useAudioLoader } from './features/audio/use-audio-loader';
import { usePronunciationGroupsStoreSync } from './features/pronunciation/use-pronunciation-groups-store-sync';

export default function App() {
  const userId = useAuthStore((state) => state.userId);
  const authLoading = useAuthStore((state) => state.loading);
  const location = useLocation();

  useAudioLoader(userId);
  useUserStoreSync(userId);
  usePronunciationGroupsStoreSync(userId);
  useThemeLoader(userId, authLoading);
  usePeriodicSync(userId);

  return (
    <>
      <GoogleAnalytics />
      <div className="max-w-container relative mx-auto flex min-h-screen flex-col justify-start">
        <ToastContainer />
        <OverlayMask />
        <IdentityLinkConflictModal />
        <Header />
        <main className="max-w-card relative mx-auto flex w-full grow flex-col items-center gap-4">
          <Outlet />
        </main>
        {location.pathname === '/' && <Footer />}
      </div>
    </>
  );
}
