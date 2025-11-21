import ButtonRectangular from "@/components/UI/button-rectangular";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/hooks/use-auth-store";
import Dashboard from "@/components/Layout/dashboard";
import SettingProperty from "@/components/UI/setting-property";
import Joyride from "react-joyride";
import { useState } from "react";
import { stepsHome } from "@/config/joyride.config";

export default function Home() {
  const navigate = useNavigate();
  const [run, setRun] = useState(false);
  const { userId, userEmail } = useAuthStore();

  return (
    <div className="flex w-full max-w-hero flex-col items-center  relative justify-start gap-4  text-center">
      <Joyride
        steps={stepsHome}
        run={run}
        continuous
        showSkipButton={false}
        disableOverlayClose={false}
        disableCloseOnEsc={false}
        hideCloseButton={true}
        hideBackButton={true}
        callback={(data) => {
          if (
            data.status === "finished" ||
            data.status === "skipped" ||
            data.status === "idle" ||
            data.action === "close"
          ) {
            setRun(false);
          }
          if (data.type === "step:after" && data.index === 5) {
            setRun(false);
            navigate("/practice", { state: { startJoyride: true } });
          }
        }}
        locale={{
          back: "Zpět",
          close: "Zavřít",
          last: "Další",
          next: "Další",
          skip: "Přeskočit",
        }}
      />
      <h1 className="landscape:pt-6 ">Angličtina</h1>
      <p className="px-4 ">
        Trénujte až 200 vět za 20 minut denně, a dosáhněte základní znalosti
        jazyka za zlomek běžného učebního času.
      </p>
      <p className="text-notice dark:text-notice-dark ">
        Aplikace v testovacím režimu
      </p>
      <p className="text-link cursor-pointer" onClick={() => setRun(true)}>
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
