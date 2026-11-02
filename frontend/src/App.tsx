import Footer from '@/components/Layout/Footer';
import Header from '@/components/Layout/Header';
import { usePeriodicSync } from '@/features/synchronization/use-periodic-sync';
import { useAuthStore } from '@/features/auth/use-auth-store';
import IdentityLinkConflictModal from '@/features/auth/IdentityLinkConflictModal';
import OverlayMask from '@/features/overlay/OverlayMask';
import { useThemeLoader } from '@/features/theme/use-theme-loader';
import ToastContainer from '@/features/toast/ToastContainer';
import { Outlet, useLocation } from 'react-router-dom';
import './styles/index.css';
import { useAudioLoader } from './features/audio/use-audio-loader';
import { useResponsiveLayout } from './components/Layout/use-responsive-layout';
import { useSideHeaderOrientation } from './components/Layout/use-side-header-orientation';
import { useInAppRouteHistory } from '@/routing/in-app-route-history';
import { useDataManagerLifecycle } from '@/database/state/use-data-manager-lifecycle';
import { ROUTES } from '@/config/routes.config';

export default function App() {
  const userId = useAuthStore((state) => state.userId);
  const authLoading = useAuthStore((state) => state.loading);
  const isHomeRoute = useLocation().pathname === ROUTES.home;

  useDataManagerLifecycle(userId, isHomeRoute);
  useInAppRouteHistory();
  useAudioLoader(userId);
  useThemeLoader(userId, authLoading);
  usePeriodicSync(userId);
  const { headerLayout, secondaryLayout } = useResponsiveLayout();
  const sideHeaderOrientation = useSideHeaderOrientation();
  return (
    <div
      className="app-shell max-w-container relative mx-auto flex flex-col justify-start"
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
