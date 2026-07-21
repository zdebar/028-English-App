import { ROUTES } from '@/config/routes.config';
import Notification from '@/components/UI/Notification';
import Footer from '@/components/Layout/Footer';
import Header from '@/components/Layout/Header';
import ProtectedLayout from '@/components/utils/protected-laout';
import { usePeriodicSync } from '@/features/synchronization/use-periodic-sync';
import { useAuthStore } from '@/features/auth/use-auth-store';
import IdentityLinkConflictModal from '@/features/auth/IdentityLinkConflictModal';
import { GoogleAnalytics } from '@/features/analytics/GoogleAnalytics';
import { reportError } from '@/features/logging/monitoring-handler';
import OverlayMask from '@/features/overlay/OverlayMask';
import { useThemeLoader } from '@/features/theme/use-theme-loader';
import ToastContainer from '@/features/toast/ToastContainer';
import { useToastStore } from '@/features/toast/use-toast-store';
import { useUserStoreSync } from '@/features/user-stats/use-user-store-sync';
import { TEXTS } from '@/locales/cs';
import Topics from '@/pages/Topics';
import TopicItems from '@/pages/TopicItems';
import Grammar from '@/pages/Grammar';
import Home from '@/pages/Home';
import Levels from '@/pages/Levels';
import NewGrammarPractice from '@/pages/NewGrammarPractice';
import Practice from '@/pages/Practice';
import PracticeOverview from '@/pages/PracticeOverview';
import PrivacyPolicy from '@/pages/PrivacyPolicy';
import Vocabulary from '@/pages/Vocabulary';
import Guide from '@/pages/Guide';
import Profile from '@/pages/Profile';
import { useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import './styles/index.css';
import { useAudioLoader } from './features/audio/use-audio-loader';

export default function App() {
  const userId = useAuthStore((state) => state.userId);
  const authLoading = useAuthStore((state) => state.loading);
  const initializeAuth = useAuthStore((state) => state.initializeAuth);
  const showToast = useToastStore((state) => state.showToast);
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

  useAudioLoader(userId);
  useUserStoreSync(userId);
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
          <Routes>
            <Route path={ROUTES.home} element={<Home />} />
            <Route path={ROUTES.privacyPolicy} element={<PrivacyPolicy />} />
            <Route path={ROUTES.guide} element={<Guide />} />
            <Route element={<ProtectedLayout />}>
              <Route path={ROUTES.practice} element={<Practice />} />
              <Route path={ROUTES.practiceNewGrammar} element={<NewGrammarPractice />} />
              <Route path={ROUTES.practiceOverview} element={<PracticeOverview />} />
              <Route path={ROUTES.profile} element={<Profile />} />
              <Route path={ROUTES.levels} element={<Levels />} />
              <Route path={ROUTES.topics} element={<Topics />} />
              <Route path={ROUTES.topicDetail} element={<TopicItems />} />
              <Route path={ROUTES.grammar} element={<Grammar />} />
              <Route path={ROUTES.vocabulary} element={<Vocabulary />} />
            </Route>
            <Route
              path="*"
              element={<Notification className="pt-8">{TEXTS.pageNotFound}</Notification>}
            />
          </Routes>
        </main>
        {location.pathname === '/' && <Footer />}
      </div>
    </>
  );
}
