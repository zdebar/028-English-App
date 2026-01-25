import Footer from '@/components/Layout/Footer';
import Header from '@/components/Layout/Header';
import OverlayMask from '@/components/UI/OverlayMask';
import ProtectedLayout from '@/components/utils/protected-laout';

import { dataSync } from '@/database/models/data-sync';
import { useAuthStore } from '@/features/auth/use-auth-store';
import { useHelpStore } from '@/features/help/use-help-store';

import ToastContainer from '@/features/toast/ToastContainer';
import Grammar from '@/pages/Grammar';
import Home from '@/pages/Home';
import Practice from '@/pages/Practice';
import PrivacyPolicy from '@/pages/PrivacyPolicy';
import Profile from '@/pages/Profile';
import Vocabulary from '@/pages/Vocabulary';

import { useEffect } from 'react';
import { Route, Routes } from 'react-router-dom';
import { TEXTS } from './config/texts';
import './styles/index.css';

export default function App() {
  const { userId, initializeAuth } = useAuthStore();
  const { isOpen, close } = useHelpStore();

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
      {isOpen && <OverlayMask onClose={close} />}
      <div className="max-w-container relative mx-auto flex min-h-screen flex-col justify-start">
        <ToastContainer />
        <Header />
        <div className="relative flex grow flex-col items-center gap-4">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route element={<ProtectedLayout />}>
              <Route path="/practice" element={<Practice />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/grammar" element={<Grammar />} />
              <Route path="/vocabulary" element={<Vocabulary />} />
            </Route>
            <Route
              path="*"
              element={<div className="error-warning pt-8">{TEXTS.pageNotFound}</div>}
            />
          </Routes>
        </div>
        <Footer />
      </div>
    </>
  );
}
