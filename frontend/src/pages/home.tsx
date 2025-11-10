import ButtonRectangular from "@/components/UI/button-rectangular";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import Dashboard from "@/components/Layout/dashboard";
import SettingProperty from "@/components/UI/setting-property";

export default function Home() {
  const navigate = useNavigate();

  const { userId, userEmail } = useAuth();

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
        <div className="flex gap-1 flex-col w-full">
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
