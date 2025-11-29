import { supabaseInstance } from "@/config/supabase.config";
import { useNavigate } from "react-router-dom";
import Button from "@/components/UI/buttons/Button";

interface AnonymousSignInButtonProps {
  captchaToken?: string;
  onSignedIn?: () => void;
  onError?: (error: unknown) => void;
  disabled?: boolean;
  resetCaptcha?: () => void;
}

export default function AnonymousSignInButton({
  captchaToken,
  onSignedIn,
  onError,
  disabled,
  resetCaptcha,
}: AnonymousSignInButtonProps) {
  const navigate = useNavigate();

  const handleAnonymousSignIn = async () => {
    if (!captchaToken) return;
    const { error } = await supabaseInstance.auth.signInAnonymously({
      options: { captchaToken },
    });
    resetCaptcha?.();
    if (error) {
      onError?.(error);
    } else {
      onSignedIn?.();
      navigate("/");
    }
  };

  return (
    <Button
      onClick={handleAnonymousSignIn}
      className="w-full grow-0"
      disabled={disabled || !captchaToken}
    >
      Vyzkoušet anonymně
    </Button>
  );
}
