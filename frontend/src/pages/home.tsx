import { useAuthStore } from "@/features/auth/use-auth-store";
import Dashboard from "@/features/dashboard/Dashboard";
import PropertyView from "@/components/UI/PropertyView";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabaseInstance } from "@/config/supabase.config";
import { useThemeStore } from "@/features/theme/use-theme";

export default function Home() {
  const { theme } = useThemeStore();
  const { userId, userEmail } = useAuthStore();

  return (
    <div className="flex w-full max-w-hero flex-col items-center  relative justify-start gap-4  text-center">
      <h1 className="landscape:pt-6 ">Angličtina</h1>
      <p className="text-notice dark:text-notice-dark ">
        Aplikace v testovacím režimu
      </p>
      <p className="px-4 ">
        Trénujte až 200 vět za 20 minut denně, a dosáhněte základní znalosti
        jazyka za zlomek běžného učebního času.
      </p>

      {!userId ? (
        <Auth
          supabaseClient={supabaseInstance}
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
          onlyThirdPartyProviders
          queryParams={{ prompt: "select_account" }}
        />
      ) : (
        <div className="flex gap-1 flex-col w-full relative">
          <PropertyView
            label="Uživatel:"
            className="h-input"
            value={userEmail}
          />
          <Dashboard />
        </div>
      )}
    </div>
  );
}
