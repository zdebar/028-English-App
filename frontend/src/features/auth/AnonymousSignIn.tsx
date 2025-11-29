import { useState, useRef } from "react";
import HCaptcha from "@hcaptcha/react-hcaptcha";
import { useNavigate } from "react-router-dom";
import { supabaseInstance } from "@/config/supabase.config";
import Button from "@/components/UI/buttons/Button";

interface Props {
  sitekey: string;
  buttonClassName?: string;
  onSuccess?: () => void;
  onError?: (error: unknown) => void;
}

export default function AnonymousSignIn({
  sitekey,
  buttonClassName = "w-full grow-0",
  onSuccess,
  onError,
}: Props) {
  const [captchaToken, setCaptchaToken] = useState<string | undefined>(
    undefined
  );
  const [isLoading, setIsLoading] = useState(false);
  const captcha = useRef<HCaptcha>(null);
  const navigate = useNavigate();

  const handleAnonymousSignIn = async () => {
    if (!captchaToken) return;
    setIsLoading(true);
    const { error } = await supabaseInstance.auth.signInAnonymously({
      options: { captchaToken },
    });
    captcha.current?.resetCaptcha();
    setCaptchaToken(undefined);
    setIsLoading(false);
    if (error) {
      onError?.(error);
    } else {
      onSuccess?.();
      navigate("/");
    }
  };

  return (
    <>
      <Button
        onClick={handleAnonymousSignIn}
        className={buttonClassName}
        disabled={!captchaToken || isLoading}
      >
        Vyzkoušet anonymně
      </Button>
      <HCaptcha ref={captcha} sitekey={sitekey} onVerify={setCaptchaToken} />
    </>
  );
}
