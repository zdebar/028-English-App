import Footer from '@/components/Layout/Footer';
import Header from '@/components/Layout/Header';
import ProtectedLayout from '@/components/utils/protected-laout';

import { dataSync, dataSyncOnUnmount } from '@/database/models/data-sync';
import { useAuthStore } from '@/features/auth/use-auth-store';

import ToastContainer from '@/features/toast/ToastContainer';
import Grammar from '@/pages/Grammar';
import Home from '@/pages/Home';
import Practice from '@/pages/Practice';
import PrivacyPolicy from '@/pages/PrivacyPolicy';
import Profile from '@/pages/Profile';
import Vocabulary from '@/pages/Vocabulary';
import { ROUTES } from './config/routes.config';
import OverlayContainer from './features/overlay/OverlayContainer';
import LoadingMessage from './components/UI/LoadingMessage';

import { useEffect, useState } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import { errorHandler } from './features/logging/error-handler';
import { useToastStore } from './features/toast/use-toast-store';
import { TEXTS } from './locales/cs';
import './styles/index.css';

export default function App() {
  const [loading, setLoading] = useState(true);
  const userId = useAuthStore((state) => state.userId);
  const initializeAuth = useAuthStore((state) => state.initializeAuth);
  const showToast = useToastStore((state) => state.showToast);
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

  // Data synchronization effect on userId change
  useEffect(() => {
    const syncData = async () => {
      setLoading(true);
      try {
        if (userId) {
          await dataSync(userId);
        }
        showToast(TEXTS.syncSuccessToast, 'success');
      } catch (error) {
        showToast(TEXTS.syncErrorToast, 'error');
        errorHandler('Data synchronization failed', error);
      } finally {
        setLoading(false);
      }
    };
    syncData();
    return () => {
      if (userId) {
        dataSyncOnUnmount(userId);
      }
    };
  }, [userId]);

  return (
    <div className="max-w-container relative mx-auto flex min-h-screen flex-col justify-start">
      <ToastContainer />
      <OverlayContainer />
      <Header />
      <main className="relative flex grow flex-col items-center gap-4">
        {loading && (
          <LoadingMessage text={TEXTS.syncLoadingText} className="notification error-warning" />
        )}
        <Routes>
          <Route path={ROUTES.home} element={<Home />} />
          <Route path={ROUTES.privacyPolicy} element={<PrivacyPolicy />} />
          <Route element={<ProtectedLayout />}>
            <Route path={ROUTES.practice} element={<Practice />} />
            <Route path={ROUTES.profile} element={<Profile />} />
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
