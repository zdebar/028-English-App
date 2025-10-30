import { Route, Routes, useLocation } from "react-router-dom";
import { useThemeStore } from "@/hooks/use-theme";
import { useEffect, useState } from "react";
import Footer from "@/components/footer";
import Header from "@/components/header";
import "./App.css";
import Profile from "@/pages/profile";
// import { useUserStore } from "@/hooks/use-user";
import PracticeCard from "@/pages/practice-card";
import Home from "@/pages/home";
import { supabase } from "@/config/supabase.config";
import type { Session } from "@supabase/supabase-js";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";

export default function App() {
  const { theme, chooseTheme } = useThemeStore();
  const [session, setSession] = useState<Session | null>(null);
  const location = useLocation();
  const showFooterRoutes = ["/"];

  // useUserStore();

  useEffect(() => {
    chooseTheme(theme);
  }, [theme, chooseTheme]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        window.location.href = "/";
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  console.log(session?.user.id); // This is the UUID

  return (
    <div className="mx-auto flex h-screen max-w-container w-full flex-col justify-between">
      <Header />
      {!session ? (
        <div className="flex flex-col items-center h-screen w-full">
          <Auth
            supabaseClient={supabase}
            appearance={{
              theme: ThemeSupa,
              variables: {
                default: {
                  colors:
                    theme === "dark"
                      ? {
                          messageText: "white",
                          anchorTextColor: "white",
                          messageTextDanger: "red",
                          inputLabelText: "white",
                          brand: "green",
                          brandAccent: "green",
                          inputBorder: "white",
                        }
                      : {
                          messageText: "black",
                          anchorTextColor: "black",
                          messageTextDanger: "red",
                          inputLabelText: "black",
                          brand: "green",
                          brandAccent: "green",
                          inputBorder: "black",
                        },
                },
              },
            }}
            providers={[]}
          />
        </div>
      ) : (
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
      )}
      {showFooterRoutes.includes(location.pathname) && <Footer />}
    </div>
  );
}
