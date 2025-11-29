import SignoutButton from "@/features/auth/SignoutButton";
import { useNavigate } from "react-router-dom";
import Button from "@/components/UI/buttons/Button";
import ResetAllButton from "@/features/auth/ResetAllButton";

export default function Profile() {
  const navigate = useNavigate();

  return (
    <>
      <div className="card-width tour-step-31 grow-0">
        <ResetAllButton />
        <Button onClick={() => navigate("/grammar")} className="grow-0">
          <p className="text-button">Přehled gramatiky</p>
        </Button>
        <Button onClick={() => navigate("/vocabulary")} className="grow-0">
          <p className="text-button">Přehled slovíček</p>
        </Button>
        <SignoutButton />
      </div>
    </>
  );
}
