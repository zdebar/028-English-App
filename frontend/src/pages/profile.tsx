import SignoutButton from "@/components/UI/buttons/SignoutButton";
import { useNavigate } from "react-router-dom";
import Button from "@/components/UI/buttons/Button";
import ResetAllButton from "@/components/UI/buttons/ResetAllButton";

export default function Profile() {
  const navigate = useNavigate();

  return (
    <>
      <div className="card-width tour-step-31 grow-0">
        <ResetAllButton />
        <Button
          onClick={() => navigate("/grammar-overview")}
          className="grow-0"
        >
          <p className="text-button">Přehled gramatiky</p>
        </Button>
        <Button
          onClick={() => navigate("/vocabulary-overview")}
          className="grow-0"
        >
          <p className="text-button">Přehled slovíček</p>
        </Button>
        <SignoutButton />
      </div>
    </>
  );
}
