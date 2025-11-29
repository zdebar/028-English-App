import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { useThemeStore } from "@/features/theme/use-theme";
import { supabaseInstance } from "@/config/supabase.config";
import AnonymousSignIn from "@/features/auth/AnonymousSignIn";

const showAuth = false;

export default function Login() {
  const { theme } = useThemeStore();
  return (
    <div className="flex flex-col items-center gap-4 h-screen w-card">
      <p className="text-notice dark:text-notice-dark ">
        Anonymní přihlášení umožňuje práci pouze offline. Synchronizace je
        znepřístupněna.
      </p>
      <AnonymousSignIn
        sitekey="42dc9b5a-022a-4494-a002-aa1af0fe5d92"
        onError={(error: unknown) =>
          console.error("Anonymous sign-in error:", error)
        }
      />
      {showAuth && (
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
        />
      )}
    </div>
  );
}
