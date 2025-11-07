import SettingProperty from "@/components/setting-property";
import ButtonSignout from "@/components/button-signout";
import { useNavigate } from "react-router-dom";
import ButtonRectangular from "@/components/button-rectangular";
import ButtonResetAll from "@/components/button-reset-all";
import { useState, useEffect } from "react";
import { getUserEmail } from "@/utils/database.utils";

export default function Profile() {
  const [userEmail, setUserEmail] = useState<string>("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchEmail = async () => {
      const email = await getUserEmail();
      setUserEmail(email || "");
    };
    fetchEmail();
  }, []);

  return (
    <div className="card-width">
      <SettingProperty
        label="Uživatel:"
        className="h-input"
        value={userEmail}
      />
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
