// import { Auth } from "@supabase/auth-ui-react";
// import { ThemeSupa } from "@supabase/auth-ui-shared";
// import { useThemeStore } from "@/hooks/use-theme";
import { supabaseInstance } from "@/config/supabase.config";
import { useNavigate } from "react-router-dom";
import HCaptcha from "@hcaptcha/react-hcaptcha";
import { useState, useRef } from "react";

export default function Login() {
  const [captchaToken, setCaptchaToken] = useState<string | undefined>(
    undefined
  );
  const captcha = useRef<HCaptcha>(null);
  // const { theme } = useThemeStore();
  const navigate = useNavigate();

  const handleAnonymousSignIn = async () => {
    if (!captchaToken) return;
    const { error } = await supabaseInstance.auth.signInAnonymously({
      options: { captchaToken },
    });
    captcha.current?.resetCaptcha();
    setCaptchaToken(undefined);
    if (error) {
      console.error("Anonymous sign-in error:", error);
    } else {
      navigate("/");
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 h-screen w-card">
      <button
        onClick={handleAnonymousSignIn}
        className="px-4 h-12 bg-green-600 w-full  text-white rounded cursor-pointer"
        disabled={!captchaToken}
      >
        Try as Guest
      </button>
      <HCaptcha
        ref={captcha}
        sitekey="42dc9b5a-022a-4494-a002-aa1af0fe5d92"
        onVerify={(token) => {
          setCaptchaToken(token);
        }}
      />
      {/* <Auth
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
      /> */}
    </div>
  );
}
