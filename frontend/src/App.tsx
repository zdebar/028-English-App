import Footer from '@/components/Layout/Footer';
import Header from '@/components/Layout/Header';
import ProtectedLayout from '@/components/utils/protected-laout';

import { dataSync } from '@/database/models/data-sync';
import { useAuthStore } from '@/features/auth/use-auth-store';

import ToastContainer from '@/features/toast/ToastContainer';
import Grammar from '@/pages/Grammar';
import Home from '@/pages/Home';
import Practice from '@/pages/Practice';
import PrivacyPolicy from '@/pages/PrivacyPolicy';
import Profile from '@/pages/Profile';
import Vocabulary from '@/pages/Vocabulary';
import { ROUTES } from './config/routes.config';
import OverlayMask from './features/overlay/OverlayMask';

import { useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import { TEXTS } from './config/texts.config';
import { useOverlayStore } from './features/overlay/use-overlay-store';
import './styles/index.css';

export default function App() {
  const userId = useAuthStore((state) => state.userId);
  const initializeAuth = useAuthStore((state) => state.initializeAuth);
  const isOverlayOpen = useOverlayStore((state) => state.isOverlayOpen);
  const location = useLocation();

  // Auth initialization effect
  useEffect(() => {
    const cleanup = initializeAuth();
    return cleanup;
  }, [initializeAuth]);

  // Data synchronization effect on userId change
  useEffect(() => {
    if (userId) {
      dataSync(userId);
    }
  }, [userId]);

  return (
    <>
      <div className="max-w-container relative mx-auto flex min-h-screen flex-col justify-start">
        <ToastContainer />
        {isOverlayOpen && <OverlayMask />}
        <Header />
        <main className="relative flex grow flex-col items-center gap-4">
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
    </>
  );
}
