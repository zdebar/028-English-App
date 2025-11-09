import ButtonSignout from "@/components/UI/button-signout";
import { useNavigate } from "react-router-dom";
import ButtonRectangular from "@/components/UI/button-rectangular";
import ButtonResetAll from "@/components/UI/button-reset-all";

export default function Profile() {
  const navigate = useNavigate();

  return (
    <div className="card-width">
      <ButtonResetAll />
      <ButtonRectangular onClick={() => navigate("/grammar-overview")}>
        <p className="text-button">Přehled gramatiky</p>
      </ButtonRectangular>
      <ButtonRectangular onClick={() => navigate("/vocabulary-overview")}>
        <p className="text-button">Přehled slovíček</p>
      </ButtonRectangular>
      <ButtonSignout />
    </div>
  );
}
