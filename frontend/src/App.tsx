import { Route, Routes } from "react-router-dom";
import { useThemeStore } from "@/hooks/use-theme";
import { useEffect } from "react";
import Footer from "@/components/footer";
import Header from "@/components/header";
import "./App.css";
import Profile from "@/pages/profile";
import PracticeCard from "@/pages/practice-card";
import Home from "@/pages/home";
import { dataSync } from "@/database/models/data-sync";
import LoginScreen from "@/components/login-screen";
import { useAuth } from "@/hooks/use-auth";
import GrammarOverview from "@/pages/grammar-overview";
import VocabularyOverview from "@/pages/vocabulary-overview";

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
      <Header />
      {!userId ? (
        <LoginScreen />
      ) : (
        <div className="relative flex h-full grow flex-col items-center ">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/practice" element={<PracticeCard />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/grammar-overview" element={<GrammarOverview />} />
            <Route
              path="/vocabulary-overview"
              element={<VocabularyOverview />}
            />
            <Route
              path="*"
              element={<div className="text-notice pt-8">Page not found</div>}
            />
          </Routes>
        </div>
      )}
      {showFooterRoutes.includes(location.pathname) && <Footer />}
    </div>
  );
}
