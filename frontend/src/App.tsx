import { Route, Routes, useLocation } from "react-router-dom";
import { useThemeStore } from "@/hooks/use-theme";
import { useEffect } from "react";
import Footer from "@/components/footer";
import Header from "@/components/header";
import "./App.css";
import Profile from "@/pages/profile";
import { useDataSync } from "@/hooks/use-data-sync";
import { useUserStore } from "@/hooks/use-user";
import PracticeCard from "@/pages/practice-card";
import Home from "@/pages/home";

export default function App() {
  const { theme, chooseTheme } = useThemeStore();
  const location = useLocation();
  const showFooterRoutes = ["/"];

  useUserStore();
  useDataSync();

  useEffect(() => {
    chooseTheme(theme);
  }, [theme, chooseTheme]);

  return (
    <div className="mx-auto flex h-screen max-w-container flex-col justify-between">
      <Header />
      <div className="relative flex h-full grow flex-col items-center overflow-y-auto">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/practice" element={<PracticeCard />} />
          <Route path="/profile" element={<Profile />} />
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
