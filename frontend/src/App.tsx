import { Route, Routes } from "react-router-dom";
import { useThemeStore } from "@/hooks/use-theme";
import { useEffect } from "react";
import Footer from "@/components/footer";
import Header from "@/components/header";
import "./App.css";
import Profile from "@/pages/profile";
import Practice from "@/pages/practice";
import Home from "@/pages/home";
import { dataSync } from "@/database/models/data-sync";
import { useAuth } from "@/hooks/use-auth";
import VocabularyOverview from "@/pages/vocabulary-overview";
import ProtectedLayout from "@/components/protected-layout";
import PublicLayout from "@/components/public-layout";
import { ToastContainer } from "react-toastify";
import Login from "@/pages/login";
import GrammarOverview from "@/pages/grammar-overview";

export default function App() {
  const { theme, chooseTheme } = useThemeStore();
  const showFooterRoutes = ["/"];
  const { userId } = useAuth();

  useEffect(() => {
    if (userId) {
      console.log("User ID detected, starting data sync.");
      dataSync();
    }
  }, [userId]);

  useEffect(() => {
    chooseTheme(theme);
  }, [theme, chooseTheme]);

  return (
    <div className="mx-auto flex h-screen max-w-container w-full overflow-y-hidden flex-col justify-between">
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
