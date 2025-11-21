import { Route, Routes } from "react-router-dom";
import { useThemeStore } from "@/hooks/use-theme";
import { useEffect } from "react";
import Footer from "@/components/Layout/footer";
import Header from "@/components/Layout/header";
import "./App.css";
import Profile from "@/pages/profile";
import Practice from "@/pages/practice";
import Home from "@/pages/home";
import { dataSync } from "@/database/models/data-sync";
import VocabularyOverview from "@/pages/vocabulary-overview";
import ProtectedLayout from "@/components/utils/protected-layout";
import PublicLayout from "@/components/utils/public-layout";
import { ToastContainer } from "react-toastify";
import Login from "@/pages/login";
import GrammarOverview from "@/pages/grammar-overview";
import { useAuthStore } from "@/hooks/use-auth-store";
import type { Session } from "@supabase/supabase-js";
import { supabaseInstance } from "@/config/supabase.config";
import Overlay from "./components/UI/overlay";
import { useOverlayStore } from "@/hooks/use-overlay-store";

export default function App() {
  const { theme, chooseTheme } = useThemeStore();
  const { userId, setSession } = useAuthStore();
  const { isOpen, close } = useOverlayStore();

  useEffect(() => {
    supabaseInstance.auth
      .getSession()
      .then(({ data: { session } }: { data: { session: Session | null } }) => {
        setSession(session);
      });

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

  useEffect(() => {
    if (userId) {
      dataSync(userId);
    }
  }, [userId]);

  return (
    <>
      {isOpen && <Overlay onClose={close} />}
      <div className="mx-auto min-h-screen  max-w-container flex flex-col justify-start">
        <ToastContainer position="top-right" autoClose={5000} />
        <Header />
        <div className="relative grow flex flex-col items-center gap-4">
          <Routes>
            <Route path="/*" element={<Home />} />
            <Route element={<PublicLayout />}>
              <Route path="/login" element={<Login />} />
            </Route>
            <Route element={<ProtectedLayout />}>
              <Route path="/practice" element={<Practice />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/grammar-overview" element={<GrammarOverview />} />
              <Route
                path="/vocabulary-overview"
                element={<VocabularyOverview />}
              />
            </Route>
            <Route
              path="/*"
              element={<div className="text-notice pt-8">Page not found</div>}
            />
          </Routes>
        </div>
        <Footer />
      </div>
    </>
  );
}
