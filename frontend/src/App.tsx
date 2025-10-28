import { Route, Routes, useLocation } from "react-router-dom";
import { useThemeStore } from "./hooks/use-theme";
import { useEffect } from "react";
import Footer from "./components/footer";
import Header from "./components/header";
import "./App.css";
import Profile from "./pages/profile";
import { useDataSync } from "./hooks/use-data-sync";
import { useUserStore } from "./hooks/use-user";
import PracticeCard from "./pages/practice-card";

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
    <div className="color-background">
      <div className="mx-auto flex h-screen max-w-[900px] flex-col justify-between">
        <Header />
        <div className="relative flex h-full grow flex-col items-center overflow-y-auto">
          <Routes>
            <Route
              path="/"
              element={
                <div className="flex w-full max-w-[450px] flex-col items-center justify-start gap-4 px-4 pt-6 text-center">
                  <h1>Angličtina</h1>
                  <p>
                    Trénujte 400 slovíček či 200 vět za 20 minut denně, a
                    dosáhněte základní znalosti jazyka za zlomek běžného
                    učebního času.
                  </p>
                  <p className="text-notice">aplikace v testovacím režimu</p>
                </div>
              }
            />
            <Route path="/practice" element={<PracticeCard />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="*" element={<div>Page not found</div>} />
          </Routes>
        </div>
        {showFooterRoutes.includes(location.pathname) && <Footer />}
      </div>
    </div>
  );
}
