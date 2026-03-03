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
import DelayedMessage from '@/components/UI/DelayedMessage';
import Profile from '@/pages/Profile';
import Guide from '@/pages/Guide';

import { useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import { errorHandler } from './features/logging/error-handler';
import { useToastStore } from './features/toast/use-toast-store';
import { TEXTS } from './locales/cs';
import './styles/index.css';
import { infoHandler } from './features/logging/info-handler';
import { useThemeStore } from './features/theme/use-theme';
import NotificationText from './components/UI/NotificationText';

export default function App() {
  const userId = useAuthStore((state) => state.userId);
  const initializeAuth = useAuthStore((state) => state.initializeAuth);
  const showToast = useToastStore((state) => state.showToast);
  const location = useLocation();
  const loadTheme = useThemeStore((state) => state.loadTheme);

  // Auth initialization effect
  useEffect(() => {
    try {
      const cleanup = initializeAuth();
      // Request persistent storage
      if (navigator.storage && navigator.storage.persist) {
        navigator.storage.persist().then((granted) => {
          if (granted) {
            infoHandler('Persistent storage granted.');
          } else {
            infoHandler('Persistent storage not granted.');
          }
        });
      }
      return cleanup;
    } catch (error) {
      showToast(TEXTS.authInitErrorToast, 'error');
      errorHandler('Auth Initialization Error', error);
    }
  }, [initializeAuth]);

  // Data synchronization
  const { loading } = usePeriodicSync(userId);

  useEffect(() => {
    loadTheme(userId || 'guest');
  }, [userId, loadTheme]);

  return (
    <div className="max-w-container relative mx-auto flex min-h-screen flex-col justify-start">
      <ToastContainer />
      <OverlayMask />
      <Header />
      <main className="relative flex grow flex-col items-center gap-4">
        {loading && (
          <div className="pointer-events-none absolute top-0 left-1/2 z-50 w-60 -translate-x-1/2">
            <DelayedMessage>
              <NotificationText text={TEXTS.syncLoadingText} className="color-info" />
            </DelayedMessage>
          </div>
        )}
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
