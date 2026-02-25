import Footer from '@/components/Layout/Footer';
import Header from '@/components/Layout/Header';
import ProtectedLayout from '@/components/utils/protected-laout';

import { startPeriodicSync } from '@/database/models/data-sync';
import { useAuthStore } from '@/features/auth/use-auth-store';
import Levels from '@/pages/Levels';

import ToastContainer from '@/features/toast/ToastContainer';
import Grammar from '@/pages/Grammar';
import Home from '@/pages/Home';
import Practice from '@/pages/Practice';
import PrivacyPolicy from '@/pages/PrivacyPolicy';
import Vocabulary from '@/pages/Vocabulary';
import { ROUTES } from '@/config/routes.config';
import OverlayContainer from '@/features/overlay/OverlayContainer';
import LoadingMessage from '@/components/UI/LoadingMessage';
import Profile from '@/pages/Profile';
import Guide from '@/pages/Guide';

import { useEffect, useState } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import { errorHandler } from './features/logging/error-handler';
import { useToastStore } from './features/toast/use-toast-store';
import { TEXTS } from './locales/cs';
import './styles/index.css';
import { infoHandler } from './features/logging/info-handler';
import { useThemeStore } from './features/theme/use-theme';

export default function App() {
  const [loading, setLoading] = useState(false);
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
  useEffect(() => {
    if (!userId) return;
    const cleanup = startPeriodicSync(userId, setLoading, showToast);
    return cleanup;
  }, [userId, showToast]);

  useEffect(() => {
    loadTheme(userId || 'guest');
  }, [userId, loadTheme]);

  return (
    <div className="max-w-container relative mx-auto flex min-h-screen flex-col justify-start">
      <ToastContainer />
      <OverlayContainer />
      <Header />
      <main className="relative flex grow flex-col items-center gap-4">
        {loading && (
          <div className="pointer-events-none absolute top-0 left-1/2 z-50 w-60 -translate-x-1/2">
            <LoadingMessage text={TEXTS.syncLoadingText} className="notification error-warning" />
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
            element={<div className="error-warning pt-8">{TEXTS.pageNotFound}</div>}
          />
        </Routes>
      </main>
      {location.pathname === '/' && <Footer />}
    </div>
  );
}
