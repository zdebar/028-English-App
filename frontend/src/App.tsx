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
import { useAuth } from "@/hooks/use-auth";
import VocabularyOverview from "@/pages/vocabulary-overview";
import ProtectedLayout from "@/components/utils/protected-layout";
import PublicLayout from "@/components/utils/public-layout";
import { ToastContainer } from "react-toastify";
import Login from "@/pages/login";
import GrammarOverview from "@/pages/grammar-overview";
// import { useAuthStore } from "@/hooks/use-auth-store";
// import type { Session } from "@supabase/supabase-js";
// import { supabaseInstance } from "@/config/supabase.config";

export default function App() {
  const { theme, chooseTheme } = useThemeStore();
  // const setSession = useAuthStore((state) => state.setSession);
  const showFooterRoutes = ["/"];
  const { userId } = useAuth();

  useEffect(() => {
    if (userId) {
      dataSync(userId);
    }
  }, [userId]);

  // useEffect(() => {
  //   supabaseInstance.auth
  //     .getSession()
  //     .then(({ data: { session } }: { data: { session: Session | null } }) => {
  //       setSession(session);
  //     });

  //   const {
  //     data: { subscription },
  //   } = supabaseInstance.auth.onAuthStateChange((_event, session) => {
  //     setSession(session);
  //   });

  //   return () => subscription.unsubscribe();
  // }, [setSession]);

  useEffect(() => {
    chooseTheme(theme);
  }, [theme, chooseTheme]);

  return (
    <div className="mx-auto flex h-screen max-w-container w-full flex-col justify-between">
      <ToastContainer position="top-right" autoClose={5000} />
      <Header />
      <div className="relative flex h-full grow flex-col  gap-4 items-center ">
        <Routes>
          <Route path="/" element={<Home />} />

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
            path="*"
            element={<div className="text-notice pt-8">Page not found</div>}
          />
        </Routes>
      </div>
      {showFooterRoutes.includes(location.pathname) && <Footer />}
    </div>
  );
}
