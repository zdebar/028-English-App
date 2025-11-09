import ButtonSignout from "@/components/button-signout";
import { useNavigate } from "react-router-dom";
import ButtonRectangular from "@/components/UI/button-rectangular";
import ButtonResetAll from "@/components/button-reset-all";

export default function Profile() {
  const navigate = useNavigate();

  return (
    <div className="card-width">
      <ButtonResetAll />
      <ButtonRectangular onClick={() => navigate("/grammar-overview")}>
        Přehled gramatiky
      </ButtonRectangular>
      <ButtonRectangular onClick={() => navigate("/vocabulary-overview")}>
        Přehled slovíček
      </ButtonRectangular>
      <ButtonSignout />
    </div>
  );
}
