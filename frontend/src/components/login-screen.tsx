import { Auth } from "@supabase/auth-ui-react";
import { supabase } from "@/config/supabase.config";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { useThemeStore } from "@/hooks/use-theme";

export default function LoginScreen() {
  const { theme } = useThemeStore();

  return (
    <div className="flex flex-col items-center h-screen w-full">
      <h1 className="text-2xl font-bold mb-4 ">Login or Register</h1>
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
  );
}
