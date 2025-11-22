import ButtonRectangular from "@/components/UI/button-rectangular";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/hooks/use-auth-store";
import Dashboard from "@/components/Layout/dashboard";
import SettingProperty from "@/components/UI/setting-property";
import { useTourStore } from "@/hooks/use-tour-store";

export default function Home() {
  const navigate = useNavigate();
  const { userId, userEmail } = useAuthStore();
  const { openTour } = useTourStore();

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
      <p className="text-link  dark:text-notice-dark " onClick={openTour}>
        Spustit průvodce
      </p>

      {!userId ? (
        <ButtonRectangular onClick={() => navigate("/login")}>
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
        </div>
      )}
    </div>
  );
}
