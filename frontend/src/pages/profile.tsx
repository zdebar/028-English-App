import SignoutButton from "@/components/UI/buttons/signout-button";
import { useNavigate } from "react-router-dom";
import RectangularButton from "@/components/UI/buttons/rectangular-button";
import ResetAllButton from "@/components/UI/buttons/reset-all-button";

export default function Profile() {
  const navigate = useNavigate();

  return (
    <>
      <div className="card-width tour-step-31 grow-0">
        <ResetAllButton />
        <RectangularButton
          onClick={() => navigate("/grammar-overview")}
          className="grow-0"
        >
          <p className="text-button">Přehled gramatiky</p>
        </RectangularButton>
        <RectangularButton
          onClick={() => navigate("/vocabulary-overview")}
          className="grow-0"
        >
          <p className="text-button">Přehled slovíček</p>
        </RectangularButton>
        <SignoutButton />
      </div>
    </>
  );
}
