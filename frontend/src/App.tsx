import { Route, Routes } from 'react-router-dom';
import { useThemeStore } from '@/features/theme/use-theme';
import { useEffect } from 'react';
import Footer from '@/components/Layout/Footer';
import Header from '@/components/Layout/Header';
import './App.css';
import Profile from '@/pages/Profile';
import Practice from '@/pages/Practice';
import Home from '@/pages/Home';
import { dataSync } from '@/database/models/data-sync';
import Vocabulary from '@/pages/Vocabulary';
import ProtectedLayout from '@/components/utils/protected-laout';
import Grammar from '@/pages/Grammar';
import { useAuthStore } from '@/features/auth/use-auth-store';
import { supabaseInstance } from '@/config/supabase.config';
import OverlayMask from '@/components/UI/OverlayMask';
import { useOverlayStore } from '@/features/overlay/use-overlay-store';
import ToastContainer from '@/features/toast/ToastContainer';
import PrivacyPolicy from '@/pages/PrivacyPolicy';

export default function App() {
  const { theme, chooseTheme } = useThemeStore();
  const { userId, setSession } = useAuthStore();
  const { isOpen, close } = useOverlayStore();

  // Handle Supabase auth state changes
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const {
          data: { session },
        } = await supabaseInstance.auth.getSession();
        setSession(session);
      } catch (error) {
        console.error('Error getting session:', error);
        setSession(null);
      }
    };

    initializeAuth();

    const {
      data: { subscription },
    } = supabaseInstance.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, [setSession]);

  useEffect(() => {
    chooseTheme(theme);
  }, [theme, chooseTheme]);

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
            <Route path="/*" element={<Home />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route element={<ProtectedLayout />}>
              <Route path="/practice" element={<Practice />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/grammar" element={<Grammar />} />
              <Route path="/vocabulary" element={<Vocabulary />} />
            </Route>
            <Route
              path="/*"
              element={<div className="text-notice color-notice pt-8">Page not found</div>}
            />
          </Routes>
        </div>
        <Footer />
      </div>
    </>
  );
}
