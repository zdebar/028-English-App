import { ROUTES } from '@/config/routes.config';
import Notification from '@/components/UI/Notification';
import Footer from '@/components/Layout/Footer';
import Header from '@/components/Layout/Header';
import ProtectedLayout from '@/components/utils/protected-laout';
import { usePeriodicSync } from '@/database/hooks/use-periodic-sync';
import { useAuthStore } from '@/features/auth/use-auth-store';
import { GoogleAnalytics } from '@/features/analytics/GoogleAnalytics';
import { reportError } from '@/features/logging/monitoring-handler';
import OverlayMask from '@/features/overlay/OverlayMask';
import { useThemeLoader } from '@/features/theme/use-theme-loader';
import ToastContainer from '@/features/toast/ToastContainer';
import { useToastStore } from '@/features/toast/use-toast-store';
import { useDailyStatsReset } from '@/features/user-stats/use-daily-stats-reset';
import { useUserStoreSync } from '@/features/user-stats/use-user-store-sync';
import { TEXTS } from '@/locales/cs';
import Blocks from '@/pages/Blocks';
import BlockItems from '@/pages/BlockItems';
import Grammar from '@/pages/Grammar';
import Home from '@/pages/Home';
import Levels from '@/pages/Levels';
import Practice from '@/pages/Practice';
import PrivacyPolicy from '@/pages/PrivacyPolicy';
import Profile from '@/pages/Profile';
import Vocabulary from '@/pages/Vocabulary';
import { lazy, Suspense, useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import './styles/index.css';

const Guide = lazy(() => import('@/pages/Guide'));

export default function App() {
  const userId = useAuthStore((state) => state.userId);
  const initializeAuth = useAuthStore((state) => state.initializeAuth);
  const authLoading = useAuthStore((state) => state.loading);
  const showToast = useToastStore((state) => state.showToast);
  const hideToast = useToastStore((state) => state.hideToast);
  const location = useLocation();

  useEffect(() => {
    try {
      const cleanup = initializeAuth();
      return cleanup;
    } catch (error) {
      showToast(TEXTS.authInitErrorToast, 'error');
      reportError('Auth Initialization Error', error);
    }
  }, [initializeAuth, showToast]);

  useUserStoreSync(userId);
  useThemeLoader(userId);
  const { loading: syncLoading } = usePeriodicSync(userId);
  useDailyStatsReset(userId);

  const loading = authLoading || syncLoading;

  useEffect(() => {
    if (loading) {
      showToast(TEXTS.syncLoadingText, 'info', true);
    } else {
      hideToast();
    }
  }, [hideToast, loading, showToast]);

  return (
    <>
      <GoogleAnalytics />
      <div className="max-w-container relative mx-auto flex min-h-screen flex-col justify-start">
        <ToastContainer />
        <OverlayMask />
        <Header />
        <main className="relative flex grow flex-col items-center gap-4">
          <Suspense
            fallback={<Notification className="pt-8">{TEXTS.syncLoadingText}</Notification>}
          >
            <Routes>
              <Route path={ROUTES.home} element={<Home />} />
              <Route path={ROUTES.privacyPolicy} element={<PrivacyPolicy />} />
              <Route path={ROUTES.guide} element={<Guide />} />
              <Route element={<ProtectedLayout />}>
                <Route path={ROUTES.practice} element={<Practice />} />
                <Route path={ROUTES.profile} element={<Profile />} />
                <Route path={ROUTES.levels} element={<Levels />} />
                <Route path={ROUTES.blocks} element={<Blocks />} />
                <Route path={ROUTES.blocksDetail} element={<BlockItems />} />
                <Route path={ROUTES.grammar} element={<Grammar />} />
                <Route path={ROUTES.vocabulary} element={<Vocabulary />} />
              </Route>
              <Route
                path="*"
                element={<Notification className="pt-8">{TEXTS.pageNotFound}</Notification>}
              />
            </Routes>
          </Suspense>
        </main>
        {location.pathname === '/' && <Footer />}
      </div>
    </>
  );
}
