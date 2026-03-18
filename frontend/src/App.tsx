import Footer from '@/components/Layout/Footer';
import Header from '@/components/Layout/Header';
import ProtectedLayout from '@/components/utils/protected-laout';
import { usePeriodicSync } from '@/database/hooks/use-periodic-sync';

import { useAuthStore } from '@/features/auth/use-auth-store';
import Levels from '@/pages/Levels';

import ToastContainer from '@/features/toast/ToastContainer';
import Grammar from '@/pages/Grammar';
import Home from '@/pages/Home';
import Practice from '@/pages/Practice';
import PrivacyPolicy from '@/pages/PrivacyPolicy';
import Vocabulary from '@/pages/Vocabulary';
import { ROUTES } from '@/config/routes.config';
import OverlayMask from './features/overlay/OverlayMask';
import Profile from '@/pages/Profile';
import Guide from '@/pages/Guide';

import { useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import { errorHandler } from './features/logging/error-handler';
import { useToastStore } from './features/toast/use-toast-store';
import { TEXTS } from './locales/cs';
import './styles/index.css';
import NotificationText from './components/UI/NotificationText';
import { useThemeLoader } from './features/theme/use-theme-loader';
import { useUserStoreSync } from './features/user-stats/use-user-store-sync';
import { useDailyStatsReset } from './features/user-stats/use-daily-stats-reset';

export default function App() {
  const userId = useAuthStore((state) => state.userId);
  const initializeAuth = useAuthStore((state) => state.initializeAuth);
  const authLoading = useAuthStore((state) => state.loading);
  const showToast = useToastStore((state) => state.showToast);
  const hideToast = useToastStore((state) => state.hideToast);
  const location = useLocation();

  // Auth initialization effect
  useEffect(() => {
    try {
      const cleanup = initializeAuth();
      return cleanup;
    } catch (error) {
      showToast(TEXTS.authInitErrorToast, 'error');
      errorHandler('Auth Initialization Error', error);
    }
  }, [initializeAuth]);

  // User store reset on user change (sign-in/sign-out)
  useUserStoreSync(userId);

  // Theme load
  useThemeLoader(userId);

  // Data synchronization
  const { loading: syncLoading } = usePeriodicSync(userId);

  // User store new day reset
  useDailyStatsReset(userId);

  const loading = authLoading || syncLoading;
  useEffect(() => {
    if (loading) {
      showToast(TEXTS.syncLoadingText, 'info', true);
    } else {
      hideToast();
    }
  }, [loading]);

  return (
    <div className="max-w-container relative mx-auto flex min-h-screen flex-col justify-start">
      <ToastContainer />
      <OverlayMask />
      <Header />
      <main className="relative flex grow flex-col items-center gap-4">
        <Routes>
          <Route path={ROUTES.home} element={<Home />} />
          <Route path={ROUTES.privacyPolicy} element={<PrivacyPolicy />} />
          <Route path={ROUTES.guide} element={<Guide />} />
          <Route element={<ProtectedLayout />}>
            <Route path={ROUTES.practice} element={<Practice />} />
            <Route path={ROUTES.profile} element={<Profile />} />
            <Route path={ROUTES.levels} element={<Levels />} />
            <Route path={ROUTES.grammar} element={<Grammar />} />
            <Route path={ROUTES.vocabulary} element={<Vocabulary />} />
          </Route>
          <Route
            path="*"
            element={<NotificationText text={TEXTS.pageNotFound} className="pt-8" />}
          />
        </Routes>
      </main>
      {location.pathname === '/' && <Footer />}
    </div>
  );
}
