import ButtonSignout from "@/components/UI/button-signout";
import { useNavigate, useLocation } from "react-router-dom";
import ButtonRectangular from "@/components/UI/button-rectangular";
import ButtonResetAll from "@/components/UI/button-reset-all";
import Joyride from "react-joyride";
import { useState, useEffect } from "react";
import { stepsProfile as steps } from "@/config/joyride.config";

export default function Profile() {
  const navigate = useNavigate();
  const [run, setRun] = useState(false); // For Joyride
  const location = useLocation();

  useEffect(() => {
    if (location.state?.startJoyride) {
      setRun(true);
    }
  }, [location.state]);

  return (
    <>
      <Joyride
        steps={steps}
        run={run}
        continuous
        showSkipButton={false}
        hideBackButton={true}
        disableOverlayClose={false}
        disableCloseOnEsc={false}
        callback={(data) => {
          if (
            data.status === "finished" ||
            data.status === "skipped" ||
            data.status === "idle" ||
            data.action === "close"
          ) {
            setRun(false);
          }
          if (data.type === "step:after" && data.index === 2) {
            setRun(false);
            navigate("/");
          }
        }}
        locale={{
          back: "Zpět",
          close: "Zavřít",
          last: "Dokončit",
          next: "Další",
          skip: "Přeskočit",
        }}
      />
      <div className="card-width joyride-step-31 grow-0">
        <ButtonResetAll />
        <ButtonRectangular
          onClick={() => navigate("/grammar-overview")}
          className="grow-0"
        >
          <p className="text-button">Přehled gramatiky</p>
        </ButtonRectangular>
        <ButtonRectangular
          onClick={() => navigate("/vocabulary-overview")}
          className="grow-0"
        >
          <p className="text-button">Přehled slovíček</p>
        </ButtonRectangular>
        <ButtonSignout />
      </div>
    </>
  );
}
