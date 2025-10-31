import { Auth } from "@supabase/auth-ui-react";
import { supabase } from "@/config/supabase.config";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { useThemeStore } from "@/hooks/use-theme";

export default function LoginScreen() {
  const { theme } = useThemeStore();

  return (
    <div className="flex flex-col items-center h-screen w-full">
      <Auth
        supabaseClient={supabase}
        appearance={{
          theme: ThemeSupa,
          style: { button: { width: 320 } },

          variables: {
            default: {
              colors:
                theme === "dark"
                  ? {
                      messageText: "white",
                      defaultButtonText: "black",
                      anchorTextColor: "white",
                      messageTextDanger: "red",
                      inputLabelText: "white",
                      brand: "green",
                      brandAccent: "green",
                      inputBorder: "white",
                    }
                  : {
                      messageText: "black",
                      defaultButtonText: "black",
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
        providers={["google"]}
      />
    </div>
  );
}
