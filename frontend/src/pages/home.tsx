import ButtonRectangular from "@/components/UI/button-rectangular";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/hooks/use-auth-store";
import Dashboard from "@/components/Layout/dashboard";
import SettingProperty from "@/components/UI/setting-property";
import HelpButton from "@/components/UI/help-button";
import Hint from "@/components/UI/hint";
import { useOverlayStore } from "@/hooks/use-overlay-store";

export default function Home() {
  const navigate = useNavigate();
  const { isOpen } = useOverlayStore();
  const { userId, userEmail } = useAuthStore();

  return (
    <div className="flex w-full max-w-hero flex-col items-center justify-start gap-4  text-center">
      <h1>Angličtina</h1>
      <p className="px-4">
        Trénujte 400 slovíček či 200 vět za 20 minut denně, a dosáhněte základní
        znalosti jazyka za zlomek běžného učebního času.
      </p>
      <p className="text-notice pb-12">aplikace v testovacím režimu</p>
      {!userId ? (
        <ButtonRectangular
          className="grow-0 max-w-card w-full mt-8"
          onClick={() => navigate("/login")}
        >
          Sign in / Sign up
        </ButtonRectangular>
      ) : (
        <div className="flex gap-1 flex-col w-full relative">
          <SettingProperty
            label="Uživatel:"
            className="h-input"
            value={userEmail}
          />
          <Dashboard />
          <Hint visibility={isOpen} style={{ bottom: "4px", right: "8px" }}>
            dnes naučeno
          </Hint>
          <HelpButton />
        </div>
      )}
    </div>
  );
}
